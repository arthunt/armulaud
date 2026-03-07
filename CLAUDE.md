# Armulaud Project Rules

## JSON: Typographic Quotes

When writing JSON files that contain Estonian or Russian text with typographic (smart) quotes:

- Estonian uses `„..."` — opening `„` (U+201E) and closing `"` (U+201D)
- Russian uses `«...»` — opening `«` (U+00AB) and closing `»` (U+00BB)

**These MUST be escaped as Unicode escapes in JSON strings**, because the closing `"` (U+201D) looks identical to the ASCII `"` (U+0022) which is the JSON string delimiter. Use `\u201e` for `„` and `\u201d` for `"`. Always validate JSON with a parser after writing.
