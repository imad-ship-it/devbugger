# DevBugger

DevBugger is a Machine Learning Fundamentals semester project. Given a MERN error report, it aims to predict the bug category and estimate the resolution time in hours.

## Assignment 3 comparative analysis

**[Open the notebook for the submitted report](./assignment_03.ipynb).** It trains and compares classifiers and regressors on the [800-report dataset](./devbugger_dataset_800.csv) and produces the evaluation tables and figures discussed in the PDF.

## Local setup

Create a virtual environment and install the pinned dependencies from the project root in PowerShell.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

To reproduce the analysis, open the project folder in VS Code, open the assignment notebook, select `.venv` as its Python kernel, and choose **Run All**. Keep the dataset CSV beside the notebook so its data-loading cell can find it. Training and prediction times vary by machine.
