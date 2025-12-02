# AEM API Commands Reference

This document provides curl + jq command sequences for managing AEM content via the JCR REST API.

## Overview

These commands are designed to help you remove `imageMimeType` from existing block instances after you have updated your `component-models.json` configuration. This is part of the migration process to use Dynamic Media with OpenAPI URLs instead of the `imageMimeType` field.

## Prerequisites

- **jq** installed on your machine
- Access to AEM Author instance with appropriate credentials
- **Developer Console access** - Your user must have developer/admin permissions to access and modify content via the JCR REST API

## Environment Variables

For the examples below, we use:

- **Author Instance**: `author-pxxxxxx-exxxxxx.adobeaemcloud.com`
- **Page Path**: `/content/<your_site_name>/<your_page_name>`
- **Root Path**: `/content/<your_site_name>/<your_page_name>/jcr:content/root`
- **User**: `<your_username>` (must have developer console access)

> **Note**: Adjust these values according to your environment. The user must have appropriate permissions to read and modify content via the JCR REST API.

---

## 1. List All Sections Under a Page Root

**Goal**: List all child nodes under `/jcr:content/root` whose names start with `section_` (e.g., `section_0`, `section_1`, etc.)

### Command

```bash
# Define the root path (adjust PAGE_PATH for another page)
PAGE_PATH="/content/<your_site_name>/<your_page_name>"
ROOT_PATH="${PAGE_PATH}/jcr:content/root"

# Fetch root.1.json and list keys starting with "section_"
curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${ROOT_PATH}.1.json" \
  | jq -r 'keys[] | select(startswith("section_"))'
```

### Example Output

```
section_0
section_1
section_2
section_1468717613
```

---

## 2. Show a Specific Block JSON

**Goal**: Fetch a block node (e.g., `/section_0/block`)

### Command

```bash
# Define the block path
BLOCK_PATH="/content/<your_site_name>/<your_page_name>/jcr:content/root/section_0/block"

# Fetch the block JSON
curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}.json" \
  | jq .
```

### Usage

You can reuse this by changing `BLOCK_PATH` to any other block node path.

---

## 3. Remove `imageMimeType` from `modelFields` for a Single Block

**Goal**: For a given block node, update `modelFields` to remove only `"imageMimeType"` and keep all other entries.

> **Important**: These commands should only be used **after** you have removed the `imageMimeType` field definition from your `component-models.json` file. This ensures that newly authored blocks won't include `imageMimeType` in their `modelFields`. These commands are for cleaning up existing block instances that were created before the component model was updated.

### Assumptions

- Block node path: `/content/<your_site_name>/<your_page_name>/jcr:content/root/section_0/block`
- You have already removed the `imageMimeType` field from the corresponding component definition in `component-models.json`

### Step-by-Step Commands

#### Step 1: Set the Block Path

```bash
BLOCK_PATH="/content/<your_site_name>/<your_page_name>/jcr:content/root/section_0/block"
```

#### Step 2: Inspect Current `modelFields`

```bash
curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}.json" \
  | jq '.modelFields'
```

**Example Output:**

```json
[
  "image",
  "imageMimeType",
  "imageTitle"
]
```

#### Step 3: Compute the New Array Without `imageMimeType`

```bash
NEW_FIELDS=$(curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}.json" \
  | jq -c '[.modelFields[] | select(. != "imageMimeType")]')

echo "$NEW_FIELDS"
```

**Example Output:**

```json
["image","imageTitle"]
```

#### Step 4: Delete the Existing `modelFields` Property

```bash
curl -u '<your_username>' -X POST \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}" \
  -F "modelFields@Delete="
```

#### Step 5: Re-create `modelFields` with the Remaining Values

This dynamically handles arrays of any length:

```bash
# Convert NEW_FIELDS to a plain list
FIELDS=($(echo "$NEW_FIELDS" | jq -r '.[]'))

# Build the curl with one -F per field
ARGS=(
  curl -u '<your_username>' -X POST
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}"
  -F "modelFields@TypeHint=String[]"
)

for f in "${FIELDS[@]}"; do
  ARGS+=(-F "modelFields=${f}")
done

# Run the curl command
"${ARGS[@]}"
```

#### Step 6: Verify the Updated `modelFields`

```bash
curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}.json" \
  | jq '.modelFields'
```

**Expected Output:**

```json
[
  "image",
  "imageTitle"
]
```

### Notes

- This sequence only drops `"imageMimeType"`. All other entries in `modelFields` are preserved and written back.
- It works for arrays of any length: 2, 3, or more values.

---

## 4. Verify the Updated Block

**Goal**: After running the update, inspect the full block to verify changes.

### Command

```bash
BLOCK_PATH="/content/<your_site_name>/<your_page_name>/jcr:content/root/section_0/block"

curl -s -u '<your_username>' \
  "https://author-pxxxxxx-exxxxxx.adobeaemcloud.com${BLOCK_PATH}.json" \
  | jq .
```

### Expected Result

- `modelFields` no longer includes `"imageMimeType"`
- The rest of the block properties (like `image`, `imageTitle`) remain unchanged

---

## Complete Workflow Example

> **Prerequisites**: Before running this script, ensure you have removed the `imageMimeType` field definition from your `component-models.json` file. For example, remove this block:
> ```json
> {
>   "component": "custom-asset-namespace:custom-asset-mimetype",
>   "valueType": "string",
>   "name": "imageMimeType"
> }
> ```
---

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Ensure your credentials are correct

### Empty or Unexpected Results

- Verify the path exists by checking the parent node
- Ensure you have read permissions on the content
- Check if the property name is correct (case-sensitive)

