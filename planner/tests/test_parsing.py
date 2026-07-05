from __future__ import annotations

from src.parsing import parse_pg_array


def test_none_returns_empty() -> None:
    assert parse_pg_array(None) == []


def test_empty_string_returns_empty() -> None:
    assert parse_pg_array("") == []


def test_pg_array_format() -> None:
    assert parse_pg_array("{DUST,MITES}") == ["DUST", "MITES"]


def test_single_element_pg_array() -> None:
    assert parse_pg_array("{SINGLE}") == ["SINGLE"]


def test_empty_braces() -> None:
    assert parse_pg_array("{}") == []


def test_plain_string_wrapped_in_list() -> None:
    assert parse_pg_array("DUST") == ["DUST"]


def test_python_list_preserved() -> None:
    assert parse_pg_array(["A", "B"]) == ["A", "B"]


def test_python_list_numbers_converted() -> None:
    assert parse_pg_array([1, 2]) == ["1", "2"]


def test_whitespace_around_string() -> None:
    assert parse_pg_array("  {A,B}  ") == ["A", "B"]


def test_leading_trailing_spaces_inner() -> None:
    assert parse_pg_array("{A , B}") == ["A ", " B"]
