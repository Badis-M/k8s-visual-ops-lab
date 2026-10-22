import io
import json
import pathlib
import runpy
import subprocess
import unittest
from contextlib import redirect_stderr, redirect_stdout
from unittest.mock import patch


SCRIPT = pathlib.Path(__file__).with_name("paginate.py")


class PaginationTests(unittest.TestCase):
    def test_resource_expired_reason_and_exit_code_are_preserved(self):
        failure = subprocess.CalledProcessError(7, ["kubectl"], stderr="Error from server (ResourceExpired): continuation token expired\n")
        stderr = io.StringIO()
        with patch("subprocess.run", side_effect=failure), redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as stopped:
                runpy.run_path(str(SCRIPT), run_name="__main__")
        self.assertEqual(stopped.exception.code, 7)
        self.assertIn("ResourceExpired", stderr.getvalue())

    def test_missing_diagnostic_has_an_explicit_fallback(self):
        failure = subprocess.CalledProcessError(1, ["kubectl"], stderr="")
        stderr = io.StringIO()
        with patch("subprocess.run", side_effect=failure), redirect_stderr(stderr):
            with self.assertRaises(SystemExit):
                runpy.run_path(str(SCRIPT), run_name="__main__")
        self.assertIn("kubectl list request failed", stderr.getvalue())

    def test_valid_pagination_keeps_snapshot_and_encodes_token(self):
        pages = [
            {"metadata": {"resourceVersion": "opaque-v1", "continue": "next/token+value"}, "items": [{"metadata": {"name": "item-a"}}]},
            {"metadata": {"resourceVersion": "opaque-v1"}, "items": [{"metadata": {"name": "item-b"}}]},
        ]
        completed = [subprocess.CompletedProcess(["kubectl"], 0, json.dumps(page), "") for page in pages]
        with patch("subprocess.run", side_effect=completed) as run, redirect_stdout(io.StringIO()) as output:
            runpy.run_path(str(SCRIPT), run_name="__main__")
        self.assertIn("Read 2 objects", output.getvalue())
        self.assertIn("continue=next%2Ftoken%2Bvalue", run.call_args_list[1].args[0][-1])


if __name__ == "__main__":
    unittest.main()
