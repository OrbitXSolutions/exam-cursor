Requirement: Partial Scoring for Multi-Choice Questions

Currently, the system supports assigning a total point at the question level, which works correctly for standard question types.

However, for multi-choice questions, there is a need to support point at the option level.

Proposed Enhancement:

Allow defining a point for each individual option within a question.
The sum of all option point must equal the total score of the question.
This enables more granular evaluation based on the selected options.

Example:

Question Total Score: 2 points
Options:
Option 1 → 0.5 points
Option 2 → 1.0 point
Option 3 → 1.5 points
Option 4 → 0 points

Expected Behavior:

When a candidate selects one or more options, the system calculates the score based on the sum of the selected options’ weights.
Validation should ensure:
Total option weights = question total score
No option exceeds the total question score
==========================================================
