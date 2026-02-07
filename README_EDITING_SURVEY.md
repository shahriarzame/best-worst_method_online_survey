# Survey Editing Guide

This guide explains how to modify the survey content in `survey_app.js` to customize your survey questions, categories, and settings.

---

## Table of Contents
1. [Overview](#overview)
2. [Basic Survey Configuration](#basic-survey-configuration)
3. [Editing Survey Metadata](#editing-survey-metadata)
4. [Editing Introduction Content](#editing-introduction-content)
5. [Editing Scale Options](#editing-scale-options)
6. [Editing Survey Sections](#editing-survey-sections)
7. [Important Rules & Constraints](#important-rules--constraints)
8. [Testing Your Changes](#testing-your-changes)

---

## Overview

The survey content is defined in the `SURVEY_SCHEMA` object at the top of `survey_app.js` (lines 4-117). This object contains all the text, questions, and structure of your survey.

**Location:** `survey_app.js`, lines 4-117

---

## Basic Survey Configuration

At the top of `SURVEY_SCHEMA`, you'll find basic settings:

```javascript
const SURVEY_SCHEMA = {
  schemaVersion: 2,              // Don't change this
  surveyId: "bw_online_survey",  // Your survey's unique ID
  surveyVersion: "2026-02",      // Your survey version (update when you make changes)
```

**What to edit:**
- `surveyId`: Change to a unique identifier for your survey (e.g., "my_barriers_survey")
- `surveyVersion`: Update when you make significant changes (e.g., "2026-03", "v1.0")

**What NOT to edit:**
- `schemaVersion`: Must remain `2` for compatibility with the Google Apps Script backend

---

## Editing Survey Metadata

### Survey Title and Welcome Message

```javascript
introContent: {
  title: "Road Freight Electrification & Automation Barriers Survey",
  welcome: "Thank you for participating in this research...",
```

**What to edit:**
- `title`: The main heading shown on the introduction page
- `welcome`: The welcome paragraph shown to participants

### Purpose and Methodology

```javascript
  purposeTitle: "Purpose of This Study",
  purposeText: "This study evaluates and ranks barriers...",
  methodologyTitle: "Survey Methodology",
  methodologySteps: [
    "Select the most challenging barrier in each category.",
    "Select the least challenging barrier in each category.",
    // ... more steps
  ],
```

**What to edit:**
- `purposeTitle`: Heading for the purpose section
- `purposeText`: Description of your study's purpose
- `methodologyTitle`: Heading for methodology section
- `methodologySteps`: Array of steps (each item is one numbered step)

### Other Introduction Fields

```javascript
  scaleTitle: "For all comparisons, use this scale",
  estimatedTime: "20-30 minutes",
  confidentialityText: "This survey is anonymous...",
  contactText: "For questions, contact...",
  figureCaption: "Figure 1: Barrier categories and sub-barriers"
```

**What to edit:**
- `scaleTitle`: Text introducing the rating scale
- `estimatedTime`: Estimated completion time
- `confidentialityText`: Privacy/confidentiality statement
- `contactText`: Your contact information
- `figureCaption`: Caption for the diagram image (if you have one)

---

## Editing Scale Options

The scale options define how participants rate comparisons between items.

**Location:** Lines 29-34 in `SURVEY_SCHEMA`

```javascript
scaleOptions: [
  { id: "slightly_more", label: "Slightly more challenging", helpText: "minor difference in impact" },
  { id: "moderately_more", label: "Moderately more challenging", helpText: "noticeable difference in impact" },
  { id: "significantly_more", label: "Significantly more challenging", helpText: "substantial difference in impact" },
  { id: "extremely_more", label: "Extremely more challenging", helpText: "very large difference in impact" }
],
```

### How to Edit Scale Options

Each scale option has three parts:

1. **`id`**: A unique identifier (use lowercase with underscores, no spaces)
2. **`label`**: The text shown to participants
3. **`helpText`**: Optional explanation shown in parentheses

**Example - Changing to a 5-point scale:**

```javascript
scaleOptions: [
  { id: "very_slightly_more", label: "Very slightly more important", helpText: "minimal difference" },
  { id: "slightly_more", label: "Slightly more important", helpText: "small difference" },
  { id: "moderately_more", label: "Moderately more important", helpText: "medium difference" },
  { id: "significantly_more", label: "Significantly more important", helpText: "large difference" },
  { id: "extremely_more", label: "Extremely more important", helpText: "very large difference" }
],
```

**Important:** You can have 2-9 scale options. Each `id` must be unique.

---

## Editing Survey Sections

Sections are the core of your survey. Each section contains items that participants will rank.

**Location:** Lines 35-116 in `SURVEY_SCHEMA`

### Section Structure

```javascript
sections: [
  {
    key: "mainCategories",           // Unique identifier (no spaces, lowercase)
    title: "Main Category Barriers", // Display title
    kind: "main",                    // "main" or "sub"
    items: [
      { id: "economic", label: "Economic" },
      { id: "environmental", label: "Environmental" },
      // ... more items
    ]
  },
  // ... more sections
]
```

### Section Fields Explained

- **`key`**: Unique identifier for this section (lowercase, no spaces, use underscores)
- **`title`**: The title shown to participants
- **`kind`**: Either `"main"` or `"sub"` (affects styling/color in the UI)
- **`items`**: Array of items to be ranked in this section

### Item Structure

```javascript
{
  id: "high_total_cost_fleet_ownership",           // Unique ID within this section
  label: "High total cost of fleet ownership",     // Text shown to participants
  description: "High ownership costs reduce..."    // Optional tooltip description
}
```

- **`id`**: Unique identifier (lowercase, underscores, no spaces)
- **`label`**: Short text shown in the survey
- **`description`**: (Optional) Longer explanation shown when clicking the info button

---

## Example: Adding a New Section

Let's say you want to add a section about "Cultural Barriers":

```javascript
{
  key: "cultural",
  title: "Cultural Barriers",
  kind: "sub",
  items: [
    {
      id: "resistance_to_change",
      label: "Resistance to change",
      description: "Cultural resistance to adopting new technologies and practices."
    },
    {
      id: "lack_of_awareness",
      label: "Lack of awareness",
      description: "Limited knowledge about benefits and opportunities."
    },
    {
      id: "organizational_inertia",
      label: "Organizational inertia",
      description: "Established routines and processes that resist innovation."
    }
  ]
}
```

**Add this object to the `sections` array** in `SURVEY_SCHEMA`.

---

## Example: Modifying Existing Items

### Before:
```javascript
items: [
  { id: "economic", label: "Economic" },
  { id: "environmental", label: "Environmental" },
]
```

### After (adding descriptions):
```javascript
items: [
  {
    id: "economic",
    label: "Economic",
    description: "Barriers related to costs, funding, and financial viability."
  },
  {
    id: "environmental",
    label: "Environmental",
    description: "Barriers related to environmental impact and sustainability."
  },
]
```

---

## Example: Changing the Main Categories Section

If you want to survey different main categories (e.g., for a different topic):

### Original:
```javascript
{
  key: "mainCategories",
  title: "Main Category Barriers",
  kind: "main",
  items: [
    { id: "economic", label: "Economic" },
    { id: "environmental", label: "Environmental" },
    { id: "technological", label: "Technological" },
    { id: "operational", label: "Operational" },
    { id: "social", label: "Social" },
    { id: "policy", label: "Policy" },
    { id: "new", label: "New" }
  ]
}
```

### Modified (for a different survey topic):
```javascript
{
  key: "mainChallenges",
  title: "Main Implementation Challenges",
  kind: "main",
  items: [
    { id: "technical", label: "Technical", description: "Technical implementation issues" },
    { id: "financial", label: "Financial", description: "Budget and cost concerns" },
    { id: "human_resources", label: "Human Resources", description: "Staffing and training needs" },
    { id: "regulatory", label: "Regulatory", description: "Legal and compliance issues" }
  ]
}
```

---

## Important Rules & Constraints

### ✅ DO:

1. **Use unique IDs**: Every section `key` and item `id` must be unique
2. **Use valid characters**: IDs should only contain lowercase letters, numbers, and underscores
3. **Keep reasonable item counts**: 2-10 items per section works best
4. **Keep labels concise**: Short, clear labels are easier for participants
5. **Update surveyVersion**: When you make changes, update the version number
6. **Test thoroughly**: Test your survey after making changes

### ❌ DON'T:

1. **Don't use spaces in IDs**: Use `"high_cost"` not `"high cost"`
2. **Don't use special characters in IDs**: Use `"workers_rights"` not `"workers' rights"`
3. **Don't change schemaVersion**: Keep it as `2`
4. **Don't delete required fields**: All fields shown above are needed
5. **Don't have too few items**: Each section needs at least 2 items
6. **Don't have too many items**: More than 10 items per section can be overwhelming

---

## Minimum Number of Items Per Section

- **Absolute minimum**: 2 items (but not recommended)
- **Recommended minimum**: 3-4 items
- **Optimal**: 4-7 items per section
- **Maximum practical**: 10 items

**Why?** With only 2 items, there are no comparison questions, making the survey less useful.

---

## Testing Your Changes

After editing `survey_app.js`:

### 1. **Syntax Check**
   - Open your browser's Developer Console (F12)
   - Reload the page
   - Check for JavaScript errors

### 2. **Visual Check**
   - Navigate through all pages
   - Verify all text appears correctly
   - Check that info buttons work (if you added descriptions)

### 3. **Complete a Test Response**
   - Fill out the entire survey
   - Submit a test response
   - Check your Google Sheet to verify data is recorded correctly

### 4. **Clear Your Browser Cache**
   - After making changes, clear cache (Ctrl+Shift+R or Cmd+Shift+R)
   - This ensures you're seeing the latest version

### 5. **Test on Different Devices**
   - Desktop browser
   - Mobile browser
   - Different screen sizes

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Duplicate IDs
```javascript
// BAD - duplicate IDs
items: [
  { id: "cost", label: "High cost" },
  { id: "cost", label: "Low revenue" }  // ERROR: duplicate ID
]
```

```javascript
// GOOD - unique IDs
items: [
  { id: "high_cost", label: "High cost" },
  { id: "low_revenue", label: "Low revenue" }
]
```

### ❌ Mistake 2: Spaces in IDs
```javascript
// BAD
{ id: "high cost", label: "High cost" }

// GOOD
{ id: "high_cost", label: "High cost" }
```

### ❌ Mistake 3: Missing Commas
```javascript
// BAD - missing comma after first item
items: [
  { id: "item1", label: "First Item" }
  { id: "item2", label: "Second Item" }
]

// GOOD
items: [
  { id: "item1", label: "First Item" },
  { id: "item2", label: "Second Item" }
]
```

### ❌ Mistake 4: Forgetting to Update the Framework Image

If you change the survey structure significantly, remember to:
1. Update the `Barriers_RF.png` image file (or remove the image reference)
2. Update the `figureCaption` text

---

## Quick Reference: What Each Section Type Does

### "main" sections:
- Displayed with blue header color (#17a2b8)
- Used for top-level categories
- Example: Main barrier categories

### "sub" sections:
- Displayed with lighter blue header color (#5dade2)
- Used for detailed subcategories
- Example: Specific barriers within each category

---

## Need More Help?

### File Structure Overview:
```
survey_app.js          ← Edit survey content here
google_apps_script.js  ← Backend script (deploy to Google Apps Script)
index.html             ← Main survey page (usually no editing needed)
```

### Key Variables:
- `SURVEY_SCHEMA`: Contains all survey content
- `GOOGLE_SCRIPT_URL`: Your deployed Google Apps Script URL (line 1-2)

### Useful Console Commands:
Open browser console (F12) and type:
```javascript
console.log(SURVEY_SCHEMA);  // View entire survey structure
console.log(responses);       // View current survey responses
```

---

## Example: Complete Section Template

Copy and customize this template for a new section:

```javascript
{
  key: "your_section_key",           // Change this
  title: "Your Section Title",        // Change this
  kind: "sub",                        // "main" or "sub"
  items: [
    {
      id: "item_1",                   // Change this
      label: "First Item",            // Change this
      description: "Description of first item."  // Optional
    },
    {
      id: "item_2",
      label: "Second Item",
      description: "Description of second item."
    },
    {
      id: "item_3",
      label: "Third Item",
      description: "Description of third item."
    },
    {
      id: "item_4",
      label: "Fourth Item",
      description: "Description of fourth item."
    }
  ]
}
```

---

## Deployment Checklist

Before deploying your edited survey:

- [ ] All section keys are unique
- [ ] All item IDs within each section are unique
- [ ] No spaces in any IDs
- [ ] Updated `surveyVersion` number
- [ ] All required fields are present
- [ ] Tested locally in browser
- [ ] Checked browser console for errors
- [ ] Completed a full test response
- [ ] Verified data appears correctly in Google Sheet
- [ ] Updated introduction text and contact info
- [ ] Updated or removed framework image if needed

---

**Good luck with your survey! 🎯**
