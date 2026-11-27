"""Regression check for the held-out demo documented in the submission."""
import unittest

from model import DevBugger, new_report_inputs


class ModelTests(unittest.TestCase):
    def test_submitted_demo(self):
        models = DevBugger()
        example = models.example
        result = models.predict(example["title"], example["body"], example["source"])
        self.assertEqual(result["bug_type"], "API_Error")
        self.assertAlmostEqual(result["estimated_hours"], 68.9387190859, places=6)

    def test_full_description_is_counted_before_text_is_capped(self):
        description = "x" * 3000 + " https://example.com"
        inputs = new_report_inputs("Report", description, "Stack Overflow").iloc[0]
        self.assertEqual(inputs["body_len_chars"], len(description))
        self.assertEqual(inputs["n_urls"], 1)
        self.assertEqual(inputs["text"], "Report " + "x" * 3000)
