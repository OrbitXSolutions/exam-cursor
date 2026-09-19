import fs from 'node:fs';
const file='Backend-API/Infrastructure/Services/Assessment/AssessmentService.cs';
let source=fs.readFileSync(file,'utf8');
function replace(old,next){if(!source.includes(old))throw new Error('Missing expected source: '+old.slice(0,80));source=source.replace(old,next);}
replace(`    bool isSuperAdmin = false;
    int? scopedDeptId = null;
    if (searchDto.FilterByUserDepartment)
    {
      isSuperAdmin = await IsCurrentUserSuperAdminAsync();
      if (!isSuperAdmin)
        scopedDeptId = await _departmentService.GetCurrentUserDepartmentIdAsync();
    }`.replaceAll('\n','\r\n'),`    // Department scope is an authorization boundary, never a client-selectable filter.
    bool isSuperAdmin = await IsCurrentUserSuperAdminAsync();
    int? scopedDeptId = isSuperAdmin ? null : await _departmentService.GetCurrentUserDepartmentIdAsync();`.replaceAll('\n','\r\n'));
replace('    if (searchDto.FilterByUserDepartment)\r\n    {\r\n      if (!isSuperAdmin)','    {\r\n      if (!isSuperAdmin)');
const groups={
 CanAccessExamResourceAsync:{DeleteExamAsync:'id, includeDeleted: true',PublishExamAsync:'id',UnpublishExamAsync:'id',ToggleExamStatusAsync:'id',GetExamSectionsAsync:'examId',CreateSectionAsync:'examId',ReorderSectionsAsync:'examId',GetAccessPolicyAsync:'examId',SaveAccessPolicyAsync:'examId',GetExamInstructionsAsync:'examId',CreateInstructionAsync:'examId',ReorderInstructionsAsync:'examId',ValidateExamForPublishAsync:'examId',GetExamBuilderAsync:'examId',SaveExamBuilderAsync:'examId'},
 CanAccessSectionResourceAsync:{GetSectionByIdAsync:'sectionId',UpdateSectionAsync:'sectionId',DeleteSectionAsync:'sectionId',GetSectionQuestionsAsync:'sectionId',AddQuestionToSectionAsync:'sectionId',BulkAddQuestionsToSectionAsync:'sectionId',ReorderQuestionsAsync:'sectionId',GetSectionTopicsAsync:'sectionId',CreateTopicAsync:'sectionId',ReorderTopicsAsync:'sectionId',ManualAddQuestionsToSectionAsync:'sectionId',RandomAddQuestionsToSectionAsync:'sectionId'},
 CanAccessTopicResourceAsync:{GetTopicByIdAsync:'topicId',UpdateTopicAsync:'topicId',DeleteTopicAsync:'topicId',GetTopicQuestionsAsync:'topicId',AddQuestionToTopicAsync:'topicId',BulkAddQuestionsToTopicAsync:'topicId',ManualAddQuestionsToTopicAsync:'topicId',RandomAddQuestionsToTopicAsync:'topicId'},
 CanAccessExamQuestionResourceAsync:{UpdateExamQuestionAsync:'examQuestionId',RemoveQuestionFromExamAsync:'examQuestionId'},
 CanAccessInstructionResourceAsync:{UpdateInstructionAsync:'instructionId',DeleteInstructionAsync:'instructionId'}
};
function prepend(name,code){const re=new RegExp(`(  public async Task<ApiResponse<(.+)>> ${name}\\([^\\r\\n]+\\)\\r?\\n  \\{\\r?\\n)`);const m=source.match(re);if(!m)throw new Error('Missing method '+name);source=source.replace(re,(_,signature,type)=>signature+code(type).replaceAll('\n','\r\n'));}
for(const [helper,methods]of Object.entries(groups))for(const[name,args]of Object.entries(methods))prepend(name,type=>`    if (!await ${helper}(${args}))\n      return ApiResponse<${type}>.FailureResponse("Exam not found or access denied");\n\n`);
for(const name of ['AddQuestionToSectionAsync','AddQuestionToTopicAsync'])prepend(name,type=>`    if (!await CanAccessBankQuestionsAsync(new[] { dto.QuestionId }))\n      return ApiResponse<${type}>.FailureResponse("Question not found or access denied");\n\n`);
for(const name of ['BulkAddQuestionsToSectionAsync','BulkAddQuestionsToTopicAsync'])prepend(name,type=>`    if (!await CanAccessBankQuestionsAsync(dto.QuestionIds))\n      return ApiResponse<${type}>.FailureResponse("Question not found or access denied");\n\n`);
for(const name of ['ManualAddQuestionsToSectionAsync','ManualAddQuestionsToTopicAsync'])prepend(name,type=>`    if (!await CanAccessBankQuestionsAsync(dto.Questions.Select(q => q.QuestionId)))\n      return ApiResponse<${type}>.FailureResponse("Question not found or access denied");\n\n`);
replace('     : entity.DepartmentId;\r\n','     : entity.DepartmentId;\r\n\r\n    if (!await HasAccessToExamAsync(newDepartmentId))\r\n      return ApiResponse<ExamDto>.FailureResponse("You do not have permission to move this exam to that department");\r\n');
source=source.replaceAll('var query = _context.Questions.Where(x => x.IsActive);','var query = (await ScopeQuestionBankAsync()).Where(x => x.IsActive);');
replace('    // Validate sections\r\n    foreach (var sectionDto in dto.Sections)\r\n    {','    // Validate all source scopes before deleting or writing any builder section.\r\n    foreach (var sectionDto in dto.Sections)\r\n    {\r\n      if (!await CanAccessQuestionPoolAsync(sectionDto.QuestionSubjectId, sectionDto.QuestionTopicId))\r\n        return ApiResponse<ExamBuilderDto>.FailureResponse("Question pool not found or access denied");\r\n    }\r\n\r\n    // Validate sections\r\n    foreach (var sectionDto in dto.Sections)\r\n    {');
replace('_cache.Remove($"exam-proctors:{examId}");','_cache.RemoveByPrefix($"exam-proctors:{examId}:");');
const helpers=`
  private async Task<bool> CanAccessDepartmentResourceAsync(IQueryable<int?> departments)
  {
    var departmentId = await departments.FirstOrDefaultAsync();
    return departmentId.HasValue && await HasAccessToExamAsync(departmentId.Value);
  }

  private Task<bool> CanAccessExamResourceAsync(int examId, bool includeDeleted = false)
  {
    var exams = includeDeleted ? _context.Exams.IgnoreQueryFilters() : _context.Exams.AsQueryable();
    return CanAccessDepartmentResourceAsync(exams.Where(e => e.Id == examId).Select(e => (int?)e.DepartmentId));
  }

  private Task<bool> CanAccessSectionResourceAsync(int sectionId) =>
    CanAccessDepartmentResourceAsync(_context.ExamSections.Where(s => s.Id == sectionId).Select(s => (int?)s.Exam.DepartmentId));

  private Task<bool> CanAccessTopicResourceAsync(int topicId) =>
    CanAccessDepartmentResourceAsync(_context.ExamTopics.Where(t => t.Id == topicId).Select(t => (int?)t.ExamSection.Exam.DepartmentId));

  private Task<bool> CanAccessExamQuestionResourceAsync(int questionId) =>
    CanAccessDepartmentResourceAsync(_context.ExamQuestions.Where(q => q.Id == questionId).Select(q => (int?)q.Exam.DepartmentId));

  private Task<bool> CanAccessInstructionResourceAsync(int instructionId) =>
    CanAccessDepartmentResourceAsync(_context.ExamInstructions.Where(i => i.Id == instructionId).Select(i => (int?)i.Exam.DepartmentId));

  private async Task<IQueryable<Domain.Entities.QuestionBank.Question>> ScopeQuestionBankAsync()
  {
    var query = _context.Questions.AsQueryable();
    if (await IsCurrentUserSuperAdminAsync()) return query;
    var departmentId = await _departmentService.GetCurrentUserDepartmentIdAsync();
    return departmentId.HasValue
      ? query.Where(q => q.Subject.DepartmentId == departmentId.Value)
      : query.Where(q => false);
  }

  private async Task<bool> CanAccessBankQuestionsAsync(IEnumerable<int> questionIds)
  {
    var ids = questionIds.Distinct().ToList();
    var query = await ScopeQuestionBankAsync();
    return await query.CountAsync(q => ids.Contains(q.Id)) == ids.Count;
  }

  private async Task<bool> CanAccessQuestionPoolAsync(int subjectId, int? topicId)
  {
    if (!await CanAccessDepartmentResourceAsync(_context.QuestionSubjects
      .Where(s => s.Id == subjectId).Select(s => (int?)s.DepartmentId))) return false;
    return !topicId.HasValue || await _context.QuestionTopics.AnyAsync(t => t.Id == topicId.Value && t.SubjectId == subjectId);
  }
`;
replace('  private async Task<bool> IsCurrentUserSuperAdminAsync()',helpers.replaceAll('\n','\r\n')+'\r\n  private async Task<bool> IsCurrentUserSuperAdminAsync()');
fs.writeFileSync(file,source);
