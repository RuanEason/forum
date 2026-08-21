export interface TextInsertion {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export function insertTextAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertedText: string,
): TextInsertion {
  const nextValue = value.slice(0, selectionStart) + insertedText + value.slice(selectionEnd);
  const nextCursor = selectionStart + insertedText.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}
