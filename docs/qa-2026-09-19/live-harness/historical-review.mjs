import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client,Evidence,must,privateConfig} from '../harness/client.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const fixture=JSON.parse(fs.readFileSync(path.join(here,'historical-question-fixtures.json'),'utf8'));
class Output extends Evidence{save(){fs.writeFileSync(path.join(here,'historical-review-evidence.json'),JSON.stringify({classification:'SIMULATED TEST: actual candidate result/review reads after isolated question mutation and original key restoration',startedAt:this.startedAt,checks:this.checks,events:this.events},null,2));}}
const e=new Output('historical-review'),c=new Client({evidence:e}),secret=privateConfig();must(await c.login(fixture.candidateEmail,secret.users.find(u=>u.email===fixture.candidateEmail)?.password??secret.password));
const review=must(await c.get(`/api/Candidate/results/my-result/${fixture.attemptId}/review`));
const question=review.questions.find(q=>q.questionId===fixture.questionId);
const selected=question.options.find(o=>o.wasSelected);
const history=JSON.parse(fs.readFileSync(path.join(here,'historical-question-evidence.json'),'utf8'));
const grading=history.events.find(x=>x.route===`/api/Grading/attempt/${fixture.attemptId}`&&x.response?.ok)?.response?.data;
const graded=grading.answers.find(x=>x.questionId===fixture.questionId);
e.check('Review selected-option correctness agrees with recorded grading correctness',selected?.isCorrect===graded.isCorrect,{question,recordedGradedAnswer:graded});
e.check('Published auto-graded review includes recorded score and correctness',question.scoreEarned===graded.score&&question.isCorrect===graded.isCorrect,{reviewScore:question.scoreEarned,reviewCorrect:question.isCorrect,gradedScore:graded.score,gradedCorrect:graded.isCorrect});
e.record({decisionRequired:'Question body and answer keys are mutable bank references. A remedy needs immutable versions/snapshots or an explicit restriction/correction policy for already-used questions. No schema or business-policy change made.',fixture});
console.log(JSON.stringify({question,score:review.totalScore,checks:e.checks},null,2));
