# Pipeline

[← Spec index](./README.md)

## Result ranking

Do not over-engineer ranking.

Start deterministic.

Suggested scoring:

```text
+ title similarity to best visual match
+ same/similar image
+ product result rather than generic page
+ known price
+ in stock
+ rating/review signal
- missing product information
- obvious mismatch
```

For “Lowest Price”:

Only compare offers believed to represent the same product.

If product identity is uncertain, label the section:

> **Similar products from $X**

rather than claiming an exact lowest market price.

Trust is more important than pretending the search is perfect.

## Category detection

The try-on integration needs a supported category.

### First implementation

Use deterministic keyword classification from the best matches.

Examples:

```text
shoe, sneaker, trainer, boot
→ shoes

shirt, jacket, hoodie, dress, pants, jeans
→ clothes

watch
→ watch

bag, handbag, purse, backpack
→ bag
```

If confidence is low:

```text
category = "other"
tryOnSupported = false
```

Do not force try-on for unsupported or ambiguous objects.

### Stretch improvement

Use a lightweight multimodal/classification model only if deterministic classification is clearly insufficient.

This is not required for the core demo.

## Image pipeline

### Scan image

Before SerpApi upload:

1. correct EXIF orientation
2. convert unsupported formats if needed
3. resize
4. compress to ≤500 KB
5. preserve enough visual detail for Lens
6. upload
7. discard temporary server copy

Suggested output:

```text
JPEG/WebP
~1200–1600px longest edge
quality dynamically reduced until ≤500 KB
```

Test actual visual-search quality before locking compression settings.

### Try-on image

Do **not** apply the aggressive SerpApi 500 KB compression rule to Perfect Corp inputs.

Use the image dimensions/file constraints required by the chosen Perfect Corp API.

Give the user category-specific instructions before capture.
