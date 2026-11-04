from app.text import paragraphs
from app.download import platform_of


def test_paragraphs_dedupes_and_breaks_on_sentence_end():
    segs = ["Hello there.", "Hello there.", "  ", *[f"Sentence number {i} goes here." for i in range(60)]]
    out = paragraphs(segs, target_chars=200)
    assert out.startswith("Hello there. Sentence number 0")
    assert out.count("Hello there.") == 1
    paras = out.split("\n\n")
    assert len(paras) > 3
    assert all(p.rstrip().endswith(".") for p in paras)


def test_paragraphs_keeps_tail_without_sentence_end():
    assert paragraphs(["no punctuation at all"]) == "no punctuation at all"


def test_platform_of():
    assert platform_of("https://youtu.be/abc") == "youtube"
    assert platform_of("https://m.youtube.com/watch?v=x") == "youtube"
    assert platform_of("https://www.instagram.com/reel/X/") == "instagram"
    assert platform_of("https://example.com/a") == "example.com"
