# DevBugger

DevBugger helps developers triage English-language bug reports from MERN applications (MongoDB, Express, React and Node.js). Enter a report and its source in the React app. A linear support vector machine (SVM) predicts the bug category, then a Decision Tree uses the report and predicted category to estimate elapsed hours.

## Run the app in VS Code

Open the DevBugger repository folder in VS Code and choose **Terminal → New Terminal**. If this is your first run on this computer, complete the [one-time setup](#one-time-setup) below. Otherwise, run this command in PowerShell from the repository root (the folder containing `app` and `project`).

```powershell
npm.cmd --prefix app start
```

The launcher builds the React interface and fits the two selected models on the original 640 training reports. When the terminal prints **DevBugger is ready at http://127.0.0.1:8765**, [open the analyzer in your browser](http://127.0.0.1:8765). Keep the terminal open while using the app. Press **Ctrl+C** there to stop it.

### Try the example

1. Click **Load example** to fill in the held-out GitHub issue *How to handle content-type mismatch?*
2. Click **Analyze report**. The expected result is **API error** and **68.94 hours**. The issue actually closed in about 4½ minutes.
3. To try your own report, select **GitHub** or **Stack Overflow**, enter a title, description, or both, and click **Analyze report** again.

GitHub time runs from issue creation to closure. Stack Overflow time runs from question creation to the posting of its accepted answer. Both measurements include waiting. On the 160 held-out reports, the SVM classified **147 correctly (91.88%)** and the tree’s average absolute timing error was **3,654 hours**. Open **Model notes** in the app for the comparison with simpler estimates.

### One-time setup

Use Python 3.13 and Node.js 24 to match the project environment. Run these commands from the repository root in PowerShell.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\project\requirements.txt
npm.cmd --prefix app ci
```

The launcher automatically uses the Python environment in `.venv`. After setup, use the start command above each time you want to run the app.

## Semester project and Assignment 3

The [main training and evaluation notebook](./project/main_model_training_and_evaluation.ipynb) is the notebook named `assignment_03.ipynb` in the submitted Assignment 3 PDF. It compares five classifiers and five regressors on 800 reports using the same 640/160 split for both tasks, stratified by source and bug category. To reproduce the results, open the notebook in VS Code, select `.venv` as its Python kernel, and choose **Run All** with `project/` as the working directory.

| Project resource | What it contains |
| --- | --- |
| [React app and Python service](./app) | The browser interface, prediction code and local launcher. |
| [Dataset](./project/devbugger_dataset_800.csv) and [data dictionary](./project/devbugger_data_dictionary_800.csv) | The 800 reports and definitions for all 37 stored columns. |
| [Collection pipeline](./project/devbugger_pipeline_800.zip) | Frozen inputs and scripts for rebuilding the dataset. |
| [Data audit](./project/data_audit.ipynb) and [data preparation](./project/data_preparation.ipynb) | Checks on labels, timestamps and duplicates, followed by the early feature preparation exercise. |

The final report and viva study guide are saved locally in `project/output/pdf/`. The editable presentation is in `project/output/slides/`. Git ignores both folders.
