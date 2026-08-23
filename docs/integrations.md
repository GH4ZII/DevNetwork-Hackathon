# External integrations

[← Spec index](./README.md)

## SerpApi

### Purpose

SerpApi provides the **discovery layer**.

RealityLens should use Google Lens to transform a user photo into structured real-world product/search results.

### Image upload

Endpoint:

```http
POST https://serpapi.com/image
Content-Type: multipart/form-data
```

Expected input:

```text
image=<binary image>
api_key=<SERPAPI_API_KEY>
```

Expected useful output:

```json
{
  "image_id": "..."
}
```

Use the returned `image_id` immediately because it is temporary.

### Google Lens search

Base endpoint:

```http
GET https://serpapi.com/search
```

Engine:

```text
engine=google_lens
```

Useful search types include:

```text
all
products
visual_matches
exact_matches
about_this_image
```

### Recommended RealityLens sequence

#### Request 1 — visual matches

Use the uploaded image to find likely product identity and visually related pages/products.

```text
type=visual_matches
```

#### Request 2 — products

Retrieve structured commerce-oriented results.

```text
type=products
```

Returned product/visual-match data may include fields such as:

- title
- link
- source
- rating
- reviews
- price
- in_stock

Do not assume every field exists.

## Perfect Corp

### Purpose

Perfect Corp provides the **experience layer**:

> “I found it. Now show me wearing it.”

Supported fashion ecosystem includes APIs for categories such as:

- clothes
- shoes
- bags
- scarves
- hats
- rings
- bracelets
- watches
- earrings
- necklaces

The exact input requirements differ by category.

### MVP recommendation

Implement categories in this order:

1. **Shoes**
2. **Watch**
3. **Clothes**

Why:

- visually obvious result
- easy to explain
- strong physical-world scan demo
- Perfect Corp directly supports these use cases

Do not integrate all categories before one works perfectly.
