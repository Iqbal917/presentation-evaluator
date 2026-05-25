from app.services.evaluate_module import _clean_transcript


def test_clean_transcript_collapses_repeated_words():
    text = "hello hello hello world world"
    cleaned = _clean_transcript(text)

    assert cleaned == "hello hello world world"


def test_clean_transcript_preserves_punctuation_and_case():
    text = "Yes yes, yes! This IS is a test."
    cleaned = _clean_transcript(text)

    assert cleaned == "Yes yes, This IS is a test."
