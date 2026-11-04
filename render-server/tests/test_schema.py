import pytest

from flowleaf_render.schema import StoryboardError, parse_lines, validate
from flowleaf_render.templates import TEMPLATES, catalog
from flowleaf_render.templates.numbers import parse_items


def test_every_template_has_valid_bilingual_examples():
    assert len(TEMPLATES) >= 6
    for tid, T in TEMPLATES.items():
        assert set(T.examples) == {"en", "ru"}, tid
        assert 2 <= len(T.styles) <= 4, tid
        for lang, ex in T.examples.items():
            sb, errs = validate(ex, TEMPLATES)
            assert not errs, (tid, lang, errs)
            assert sb["lang"] == lang


def test_catalog_is_json_serialisable_and_complete():
    import json
    cat = json.loads(json.dumps(catalog(), ensure_ascii=False))
    for t in cat["templates"]:
        assert t["formats"] == ["9x16", "1x1", "16x9"]
        assert t["name"]["ru"] and t["name"]["en"]
        for k in t["sceneKinds"]:
            assert k["duration"]["min"] <= k["duration"]["default"] <= k["duration"]["max"]
            for f in k["fields"]:
                assert f["label"]["en"] and f["label"]["ru"]


def test_soft_errors_are_fixed_hard_errors_raise():
    sb = {"template": "explainer", "style": "neon", "format": "4x3", "scenes": [
        {"kind": "intro", "duration": 99, "fields": {"title": "x" * 500}},
        {"kind": "step", "fields": {"title": "Do it", "icon": "nope"}}]}
    clean, errs = validate(sb, TEMPLATES)
    assert clean["style"] == "paper" and clean["format"] == "9x16"
    assert clean["scenes"][0]["duration"] == 6.0
    assert len(clean["scenes"][0]["fields"]["title"]) == 70
    assert clean["scenes"][1]["fields"]["icon"] == "idea"
    assert all(e.get("soft") for e in errs)
    with pytest.raises(StoryboardError):
        validate({"template": "explainer", "scenes": [{"kind": "step", "fields": {}}]}, TEMPLATES)
    with pytest.raises(StoryboardError):
        validate({"template": "nope", "scenes": []}, TEMPLATES)


def test_parse_lines_and_items():
    assert parse_lines("2, 4-6") == [2, 4, 5, 6]
    assert parse_lines("x, 3") == [3]
    assert parse_items(["Python: 48%", "JS — 1 200", "bad line", "Go: 7,5"]) == [
        ("Python", 48.0, "%"), ("JS", 1200.0, ""), ("Go", 7.5, "")]
