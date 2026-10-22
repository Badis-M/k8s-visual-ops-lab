import io
import json
import os
import pathlib
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import Mock

from ownership import CONTEXT, EXERCISE, EXERCISE_LABEL, NAMESPACE, RUN_LABEL, record_marker, request_cleanup


class OwnershipTests(unittest.TestCase):
    def namespace(self, uid="original-uid", run_id="a" * 32):
        return {"metadata": {"name": NAMESPACE, "uid": uid, "resourceVersion": "opaque-42", "labels": {EXERCISE_LABEL: EXERCISE, RUN_LABEL: run_id}}}

    def test_missing_marker_cannot_issue_any_api_request(self):
        runner = Mock()
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(FileNotFoundError):
                request_cleanup(pathlib.Path(directory, "absent.json"), runner)
        runner.assert_not_called()

    def test_replaced_namespace_uid_never_reaches_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            runner = Mock(return_value=subprocess.CompletedProcess([], 0, json.dumps(self.namespace(uid="replacement-uid")), ""))
            with self.assertRaisesRegex(ValueError, "refusing cleanup"):
                request_cleanup(marker, runner)
            self.assertEqual(runner.call_count, 1)

    def test_changed_run_label_never_reaches_delete(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            runner = Mock(return_value=subprocess.CompletedProcess([], 0, json.dumps(self.namespace(run_id="b" * 32)), ""))
            with self.assertRaises(ValueError):
                request_cleanup(marker, runner)
            self.assertEqual(runner.call_count, 1)

    def test_owned_namespace_delete_has_server_side_uid_and_version_guards(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            self.assertEqual(marker.stat().st_mode & 0o777, 0o600)
            runner = Mock(side_effect=[subprocess.CompletedProcess([], 0, json.dumps(self.namespace()), ""), subprocess.CompletedProcess([], 0, "{}", "")])
            with redirect_stdout(io.StringIO()):
                request_cleanup(marker, runner)
            deletion = runner.call_args_list[1]
            self.assertEqual(deletion.args[0], ["kubectl", "--context", CONTEXT, "--request-timeout=10s", "delete", "--raw", "/api/v1/namespaces/lab-csi", "-f", "-"])
            self.assertEqual(json.loads(deletion.kwargs["input"])["preconditions"], {"uid": "original-uid", "resourceVersion": "opaque-42"})

    def test_public_or_symbolic_marker_is_refused_before_api(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            os.chmod(marker, 0o644)
            runner = Mock()
            with self.assertRaises(ValueError):
                request_cleanup(marker, runner)
            runner.assert_not_called()
            os.chmod(marker, 0o600)
            link = pathlib.Path(directory, "link.json")
            link.symlink_to(marker)
            with self.assertRaises(ValueError):
                request_cleanup(link, runner)
            runner.assert_not_called()

    def test_record_refuses_to_replace_existing_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            original = marker.read_bytes()
            with self.assertRaises(FileExistsError):
                record_marker(marker, self.namespace(), "a" * 32)
            self.assertEqual(marker.read_bytes(), original)

    def test_preflight_refusal_creates_no_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = pathlib.Path(directory)
            kubectl = folder / "kubectl"
            kubectl.write_text('#!/bin/sh\nprintf "namespace/lab-csi\\n"\n')
            kubectl.chmod(0o700)
            script = pathlib.Path(__file__).with_name("snapshot-cycle.sh")
            result = subprocess.run(["bash", str(script), "test-class", "test-snapshot"], env={**os.environ, "PATH": f"{folder}:{os.environ['PATH']}", "TMPDIR": str(folder)}, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("already exists", result.stderr)
            self.assertEqual(list(folder.glob("k8s-csi-run.*")), [])

    def test_created_namespace_records_uid_before_a_later_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = pathlib.Path(directory)
            kubectl = folder / "kubectl"
            log = folder / "calls.jsonl"
            kubectl.write_text('''#!/usr/bin/env python3
import json, os, pathlib, re, sys
args = sys.argv[1:]
with open(os.environ["CSI_MOCK_LOG"], "a") as output:
    output.write(json.dumps(args) + "\\n")
if "create" in args:
    manifest = sys.stdin.read()
    run_id = re.search(r'lab.k8sops.dev/run: "([a-f0-9]+)"', manifest).group(1)
    print(json.dumps({"metadata": {"name": "lab-csi", "uid": "created-response-uid", "labels": {"lab.k8sops.dev/exercise": "csi-snapshot-cycle", "lab.k8sops.dev/run": run_id}}}))
elif "apply" in args:
    sys.stdin.read()
    print("synthetic fixture apply failure", file=sys.stderr)
    sys.exit(1)
elif args[-1] == "jsonpath={.provisioner}" or args[-1] == "jsonpath={.driver}":
    print("test.csi.dev", end="")
elif args[-1] in ("jsonpath={.deletionPolicy}", "jsonpath={.reclaimPolicy}"):
    print("Delete", end="")
''')
            kubectl.chmod(0o700)
            script = pathlib.Path(__file__).with_name("snapshot-cycle.sh")
            result = subprocess.run(["bash", str(script), "test-class", "test-snapshot"], env={**os.environ, "PATH": f"{folder}:{os.environ['PATH']}", "TMPDIR": str(folder), "CSI_MOCK_LOG": str(log)}, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            markers = list(folder.glob("k8s-csi-run.*/ownership.json"))
            self.assertEqual(len(markers), 1)
            self.assertEqual(json.loads(markers[0].read_text())["namespace_uid"], "created-response-uid")
            self.assertIn(str(markers[0]), result.stdout)
            calls = [json.loads(line) for line in log.read_text().splitlines()]
            self.assertFalse(any("delete" in call for call in calls))

    def test_server_precondition_conflict_is_not_retried(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = pathlib.Path(directory, "ownership.json")
            record_marker(marker, self.namespace(), "a" * 32)
            conflict = subprocess.CalledProcessError(1, ["kubectl"], stderr="Conflict: UID precondition failed")
            runner = Mock(side_effect=[subprocess.CompletedProcess([], 0, json.dumps(self.namespace()), ""), conflict])
            with self.assertRaises(subprocess.CalledProcessError):
                request_cleanup(marker, runner)
            self.assertEqual(runner.call_count, 2)


if __name__ == "__main__":
    unittest.main()
