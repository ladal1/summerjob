from __future__ import annotations

from typing import Any

import pandas as pd
from pulp import LpMinimize, LpProblem

from src.solver import (
    dictionarify,
    is_viable,
    restrict_pair,
    transform_score,
)


# ---------------------------------------------------------------------------
# dictionarify
# ---------------------------------------------------------------------------

class TestDictionarify:
    def test_empty_list(self) -> None:
        assert dictionarify([]) == {}

    def test_single_row(self) -> None:
        rows = [{"id": "a", "name": "Alice"}]
        assert dictionarify(rows) == {"a": {"id": "a", "name": "Alice"}}

    def test_multiple_rows(self) -> None:
        rows = [{"id": 1, "val": "x"}, {"id": 2, "val": "y"}]
        result = dictionarify(rows)
        assert set(result.keys()) == {"1", "2"}
        assert result["1"]["val"] == "x"

    def test_preserves_original_dict(self) -> None:
        rows = [{"id": "x", "nested": {"inner": 42}}]
        result = dictionarify(rows)
        assert result["x"]["nested"]["inner"] == 42

    def test_id_string_coercion(self) -> None:
        rows = [{"id": 42, "data": "test"}]
        result = dictionarify(rows)
        assert "42" in result


# ---------------------------------------------------------------------------
# transform_score
# ---------------------------------------------------------------------------

class TestTransformScore:
    def test_empty(self) -> None:
        assert transform_score([]) == {}

    def test_single_score(self) -> None:
        rows = [{"job": "j1", "worker": "w1", "score": 5}]
        assert transform_score(rows) == {("j1", "w1"): 5}

    def test_multiple_scores(self) -> None:
        rows = [
            {"job": "j1", "worker": "w1", "score": 1},
            {"job": "j1", "worker": "w2", "score": 2},
            {"job": "j2", "worker": "w1", "score": 3},
        ]
        result = transform_score(rows)
        assert result[("j1", "w1")] == 1
        assert result[("j1", "w2")] == 2
        assert result[("j2", "w1")] == 3

    def test_id_coercion(self) -> None:
        rows = [{"job": 10, "worker": 20, "score": 99}]
        result = transform_score(rows)
        assert ("10", "20") in result
        assert result[("10", "20")] == 99


# ---------------------------------------------------------------------------
# is_viable
# ---------------------------------------------------------------------------

class TestIsViable:
    def test_viable_no_allergies_no_adoration(self) -> None:
        worker: dict[str, Any] = {"workAllergies": [], "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": [], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is True

    def test_allergy_conflict(self) -> None:
        worker: dict[str, Any] = {"workAllergies": ["DUST"], "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": ["DUST"], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is False

    def test_allergy_no_conflict(self) -> None:
        worker: dict[str, Any] = {"workAllergies": ["DUST"], "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": ["MITES"], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is True

    def test_adoring_worker_on_supporting_job(self) -> None:
        worker: dict[str, Any] = {"workAllergies": [], "isAdoring": True}
        job: dict[str, Any] = {"id": "j1", "allergens": [], "supportsAdoration": True}
        assert is_viable(worker, job, _attempt=0) is True

    def test_adoring_worker_on_non_supporting_job(self) -> None:
        worker: dict[str, Any] = {"workAllergies": [], "isAdoring": True}
        job: dict[str, Any] = {"id": "j1", "allergens": [], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is False

    def test_non_adoring_worker_ignores_adoration_flag(self) -> None:
        worker: dict[str, Any] = {"workAllergies": [], "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": [], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is True

    def test_pg_array_worker_allergies(self) -> None:
        worker: dict[str, Any] = {"workAllergies": "{DUST,MITES}", "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": ["DUST"], "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is False

    def test_pg_array_job_allergens(self) -> None:
        worker: dict[str, Any] = {"workAllergies": ["DUST"], "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": "{DUST,MITES}", "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is False

    def test_none_allergies(self) -> None:
        worker: dict[str, Any] = {"workAllergies": None, "isAdoring": False}
        job: dict[str, Any] = {"id": "j1", "allergens": None, "supportsAdoration": False}
        assert is_viable(worker, job, _attempt=0) is True


# ---------------------------------------------------------------------------
# restrict_pair
# ---------------------------------------------------------------------------

class TestRestrictPair:
    def test_both_vars_exist_adds_constraint(self) -> None:
        model = LpProblem(name="test", sense=LpMinimize)
        from pulp import LpVariable
        df = pd.DataFrame(
            [[LpVariable("x_w1", cat="Binary"), LpVariable("x_w2", cat="Binary")]],
            index=pd.Index(["job1"], name="job"),
            columns=pd.Index(["w1", "w2"], name="worker"),
        )

        result = restrict_pair("w1", "w2", "job1", model, df)
        assert result is model
        assert len(model.constraints) == 1

    def test_one_var_missing_skips_constraint(self) -> None:
        model = LpProblem(name="test", sense=LpMinimize)
        from pulp import LpVariable
        df = pd.DataFrame(
            [[LpVariable("x_w1", cat="Binary")]],
            index=pd.Index(["job1"], name="job"),
            columns=pd.Index(["w1"], name="worker"),
        )

        restrict_pair("w1", "missing", "job1", model, df)
        assert len(model.constraints) == 0

    def test_both_missing_skips(self) -> None:
        model = LpProblem(name="test", sense=LpMinimize)
        df = pd.DataFrame(
            index=pd.Index(["job1"], name="job"),
            columns=pd.Index(["w1"], name="worker"),
            dtype=object,
        )
        restrict_pair("x", "y", "job1", model, df)
        assert len(model.constraints) == 0
