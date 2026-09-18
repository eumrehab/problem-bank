"""Create a reproducible shuffled exam and its matching answer key."""

import random

from make_medical_law_1_74 import (
    make_answer_pdf,
    make_question_pdf,
    verified_questions,
)


SEED = 20260917


def main():
    questions, source_answers = verified_questions()
    shuffled_indices = list(range(74))
    random.Random(SEED).shuffle(shuffled_indices)
    if sorted(shuffled_indices) != list(range(74)):
        raise RuntimeError("무작위 배열에서 문항이 누락되거나 중복됐습니다.")

    shuffled_questions = [questions[index] for index in shuffled_indices]
    shuffled_answers = [source_answers[index] for index in shuffled_indices]
    for number, (question, answer) in enumerate(zip(shuffled_questions, shuffled_answers), start=1):
        if question["answer"] != answer:
            raise RuntimeError(f"무작위 문제 {number}번의 정답이 일치하지 않습니다.")

    print(f"questions=74, unique=74, answer_mismatches=0, seed={SEED}")
    print(make_question_pdf(shuffled_questions, randomized=True))
    print(make_answer_pdf(shuffled_answers, randomized=True))


if __name__ == "__main__":
    main()
