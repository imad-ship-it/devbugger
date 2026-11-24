# DevBugger prompt log

This log records major AI-assisted work on DevBugger. Entries are summaries when the original prompt wording is unavailable.

## Assemble the bug-report dataset

**Work recorded from the project files.** Claude and ChatGPT helped assemble the dataset, column dictionary, and dataset-building pipeline. The 800-report build combines 550 GitHub issues and 250 Stack Overflow questions using the saved review files and label overrides.

**Result.** The project has one row per report in `devbugger_dataset_800.csv`. `Bug_Type` is the classification target. `resolution_hours` is the regression target. It measures time from issue creation to closure on GitHub, or from question creation to the posting of the accepted answer on Stack Overflow.

**Checked.** The build reproduced the CSV byte for byte, and the dictionary covers all 37 columns. We confirmed 800 unique report URLs, all five classes, and both targets on every row. The GitHub rows span 58 repositories, compared with 20 planned in the proposal.

## Redact tokens from the dataset build

**Issue reported.** GitHub push protection rejected the checkpoint after detecting an authentication token in copied report text.

**Result.** We redacted token-like strings in the archived review inputs and rebuilt the dataset. We amended the rejected local commit and pushed the corrected checkpoint as `097ff8e`.

**Checked.** The rebuild still contained all 800 report identities and their original bug categories and resolution times. GitHub accepted the corrected push.

## Audit the reports and resolution times

**Prompt summary.** Walk through the data audit one check at a time, then turn the checks into a reproducible notebook.

**Result.** We inspected an authentication issue on GitHub and a CORS question on Stack Overflow, checked their labels, and compared resolution times across sources. The median time to GitHub issue closure was 175.68 hours. The median time to an accepted Stack Overflow answer was 1.11 hours. [Data audit notebook](./data_audit.ipynb)

**Checked.** Recalculating elapsed time from the two timestamps matched the stored duration within rounding tolerance for all 800 rows. We flagged the longest GitHub issue for review because its closure date alone cannot establish when the bug was fixed.

## Prepare model inputs and a shared train/test split

**Prompt summary.** Choose inputs available when a report is posted, create one split for both prediction tasks, and fit preprocessing on the training reports.

**Result.** We stratified by bug type and saved the assignments by report ID. The preprocessor converts the title and body to TF-IDF features, one-hot encodes the source, and scales title and body lengths. [Data preparation notebook](./data_preparation.ipynb) · [Saved split](./devbugger_split.csv)

**Checked.** All 800 IDs appeared exactly once. The 640 training reports and 160 test reports had no overlap. Applying the fitted preprocessor produced the same 17,257 feature columns in both sets.

