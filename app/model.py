"""Serve the two selected pipelines from the final DevBugger experiment."""
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeRegressor
from threadpoolctl import threadpool_limits

DATASET = Path(__file__).resolve().parents[1] / "project" / "devbugger_dataset_800.csv"
SEED = 42


CODE_FENCE = re.compile(r"```.*?```", re.S)
URL_RE = re.compile(r"https?://\S+")
STACK_RE = re.compile(r"^\s*at\s+\S.*:\d+(?::\d+)?\)?\s*$|Traceback \(most recent call last\)", re.M)
ERRCODE_RE = re.compile(r"\b(?:ECONN[A-Z]+|ENOTFOUND|ETIMEDOUT|ETIMEOUT|EPIPE|EADDRINUSE|EACCES|EPERM|ENOENT|EAI_AGAIN|EHOSTUNREACH|ENETUNREACH|ERR_[A-Z0-9_]+)\b")
HTTP_RE = re.compile(
    r"(?:status(?: code)?|http|response|error|code)\D{0,12}\b([45]\d\d)\b"
    r"|\b[45]\d\d\s+(?:unauthorized|forbidden|not found|bad request|internal server error|bad gateway|"
    r"service unavailable|gateway time-?out|payload too large|too many requests|method not allowed)", re.I)
VERSION_RE = re.compile(r"\b\d+\.\d+\.\d+\b|\bversion\b", re.I)
REPRO_RE = re.compile(r"steps? to reproduce|to reproduce|reproduc|codesandbox|stackblitz|jsfiddle|minimal (?:example|repro)|\brepro\b", re.I)


counts = ["title_len_words", "body_len_chars", "n_code_blocks", "n_urls"]
flags = ["has_stack_trace", "has_error_code", "has_http_status", "has_version_info", "has_repro_steps"]


def filing_inputs(reports):
    inputs = reports[["source", *counts, *flags]].copy()
    inputs["text"] = (reports.report_title.fillna("") + " " + reports.body.fillna("")).str.replace(
        r"https?://\S+|(?:[A-Za-z]:\\|/home/|/Users/)\S+|:\d+:\d+\b", " ", regex=True)
    return inputs


def preprocessing(regression):
    cat = ["source", "Bug_Type"] if regression else ["source"]
    return ColumnTransformer([
        ("text", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=5000,
                                 sublinear_tf=True), "text"),
        ("categorical", make_pipeline(SimpleImputer(strategy="constant", fill_value="Unknown"),
                                      OneHotEncoder(handle_unknown="ignore")), cat),
        ("counts", make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), counts),
        ("flags", SimpleImputer(strategy="most_frequent"), flags),
    ], sparse_threshold=1.0)

def hours_from_log(values):
    return np.maximum(0.0, np.expm1(values))


def new_report_inputs(title, body, source):
    """Create the same filing-time features used by the notebook demo."""
    if source not in ("GitHub", "Stack Overflow"):
        raise ValueError("Choose GitHub or Stack Overflow as the report source.")
    if not (title.strip() or body.strip()):
        raise ValueError("Enter a report title or description.")

    # Match the frozen dataset builder's Markdown cleaning and full-body counts.
    body = body.replace("\r\n", "\n")
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    body = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", body)
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    full_text = title + "\n" + body
    report = {
        "report_title": title,
        "body": body[:3000],
        "source": source,
        "title_len_words": len(title.split()),
        "body_len_chars": len(body),
        "n_code_blocks": len(CODE_FENCE.findall(body)),
        "n_urls": len(URL_RE.findall(body)),
        "has_stack_trace": int(bool(STACK_RE.search(body))),
        "has_error_code": int(bool(ERRCODE_RE.search(full_text))),
        "has_http_status": int(bool(HTTP_RE.search(full_text))),
        "has_version_info": int(bool(VERSION_RE.search(body))),
        "has_repro_steps": int(bool(REPRO_RE.search(body))),
    }
    return filing_inputs(pd.DataFrame([report]))


class DevBugger:
    def __init__(self, dataset=DATASET):
        reports = pd.read_csv(dataset)
        strata = reports["source"] + "|" + reports["Bug_Type"]
        train, test = train_test_split(
            np.arange(len(reports)), test_size=0.2, random_state=SEED, stratify=strata
        )
        training = reports.iloc[train]
        inputs = filing_inputs(training)
        self.classifier = make_pipeline(
            preprocessing(False),
            SVC(kernel="linear", C=1, class_weight="balanced", random_state=SEED),
        )
        self.regressor = make_pipeline(
            preprocessing(True),
            TransformedTargetRegressor(
                regressor=DecisionTreeRegressor(max_depth=5, min_samples_leaf=8, random_state=SEED),
                func=np.log1p,
                inverse_func=hours_from_log,
            ),
        )
        with threadpool_limits(limits=1):
            self.classifier.fit(inputs, training["Bug_Type"])
            self.regressor.fit(inputs.assign(Bug_Type=training["Bug_Type"]), training["resolution_hours"])

        example = reports.iloc[test].set_index("row_id").loc[323]
        self.example = {
            "title": example["report_title"], "body": example["body"],
            "source": example["source"], "url": example["url"],
        }

    def predict(self, title, body, source):
        inputs = new_report_inputs(title, body, source)
        category = self.classifier.predict(inputs)[0]
        hours = self.regressor.predict(inputs.assign(Bug_Type=category))[0]
        return {"bug_type": str(category), "estimated_hours": float(hours)}
