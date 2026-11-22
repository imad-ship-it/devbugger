# DevBugger prompt log

This log records major AI-assisted work on DevBugger. Entries are summaries when the original prompt wording is unavailable.

## Assemble the bug-report dataset

**Work recorded from the project files.** Claude and ChatGPT helped assemble the dataset, column dictionary, and dataset-building pipeline. The 800-report build combines 550 GitHub issues and 250 Stack Overflow questions using the saved review files and label overrides.

**Result.** The project has one row per report in `devbugger_dataset_800.csv`. `Bug_Type` is the classification target. `resolution_hours` is the regression target. It measures time from issue creation to closure on GitHub, or from question creation to the posting of the accepted answer on Stack Overflow.

**Checked.** The build reproduced the CSV byte for byte, and the dictionary covers all 37 columns. We confirmed 800 unique report URLs, all five classes, and both targets on every row. The GitHub rows span 58 repositories, compared with 20 planned in the proposal. We still need to spot-check labels and durations against the source reports.

## Redact tokens from the dataset build

**Issue reported.** GitHub push protection rejected the checkpoint after detecting an authentication token in copied report text.

**Result.** We redacted token-like strings in the archived review inputs and rebuilt the dataset. We amended the rejected local commit and pushed the corrected checkpoint as `097ff8e`.

**Checked.** The rebuild still contained all 800 report identities and their original bug categories and resolution times. GitHub accepted the corrected push.

