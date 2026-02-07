// ============================================
// GOOGLE APPS SCRIPT - Survey Response Handler
// ============================================
//
// SETUP INSTRUCTIONS:
// 1. Go to Google Sheets (sheets.google.com) and create/open your spreadsheet
// 2. Click Extensions > Apps Script
// 3. Replace the editor content with this file and save
// 4. Click Deploy > New deployment
// 5. Select type: Web app
// 6. Set:
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Deploy and copy the Web App URL
// 8. Paste the URL into index.html (GOOGLE_SCRIPT_URL)
//
// This script supports:
// - Legacy payloads (schemaVersion missing): writes fixed columns to "Responses"
// - V2 payloads (schemaVersion >= 2): writes normalized rows to:
//   - Responses_Meta
//   - Responses_Sections
//   - Responses_Comparisons
//
// ============================================

const LEGACY_SHEET_NAME = "Responses";
const V2_META_SHEET_NAME = "Responses_Meta";
const V2_SECTIONS_SHEET_NAME = "Responses_Sections";
const V2_COMPARISONS_SHEET_NAME = "Responses_Comparisons";

function doPost(e) {
  try {
    const data = parsePayload(e);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let result;
    if (isV2Payload(data)) {
      result = handleV2Submission(ss, data);
    } else {
      result = handleLegacySubmission(ss, data);
    }

    return jsonResponse({
      status: "success",
      mode: result.mode,
      message: result.message,
      responseId: result.responseId || ""
    });
  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

function doGet() {
  return jsonResponse({
    status: "ok",
    message: "Survey backend is running"
  });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing POST payload");
  }
  return JSON.parse(e.postData.contents);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isV2Payload(data) {
  if (!isObject(data)) return false;
  const schemaVersion = Number(data.schemaVersion || 0);
  return schemaVersion >= 2 && isObject(data.responses);
}

// ============================================
// V2 HANDLER (DYNAMIC / NORMALIZED)
// ============================================

function handleV2Submission(ss, data) {
  const validationErrors = validateV2Payload(data);
  if (validationErrors.length > 0) {
    throw new Error("Invalid v2 payload: " + validationErrors.join(" | "));
  }

  const responseId = Utilities.getUuid();
  const nowIso = new Date().toISOString();

  const respondent = isObject(data.respondent) ? data.respondent : {};
  const responses = isObject(data.responses) ? data.responses : {};
  const schemaSnapshot = isObject(data.schemaSnapshot) ? data.schemaSnapshot : {};
  const schemaSections = Array.isArray(schemaSnapshot.sections) ? schemaSnapshot.sections : [];
  const schemaScaleOptions = Array.isArray(schemaSnapshot.scaleOptions) ? schemaSnapshot.scaleOptions : [];
  const sectionDefMap = buildSectionDefinitionMap(schemaSections);
  const scaleDef = buildScaleDefinition(schemaScaleOptions);

  const metaSheet = ensureSheetWithHeaders(ss, V2_META_SHEET_NAME, getV2MetaHeaders());
  const sectionsSheet = ensureSheetWithHeaders(ss, V2_SECTIONS_SHEET_NAME, getV2SectionsHeaders());
  const comparisonsSheet = ensureSheetWithHeaders(ss, V2_COMPARISONS_SHEET_NAME, getV2ComparisonsHeaders());

  const clientMeta = isObject(data.clientMeta) ? data.clientMeta : {};
  const metaRow = [
    nowIso,
    responseId,
    String(data.schemaVersion || ""),
    data.surveyId || "",
    data.surveyVersion || "",
    data.submittedAt || nowIso,
    respondent.startTime || "",
    respondent.endTime || "",
    respondent.name || "",
    respondent.email || "",
    respondent.organization || "",
    respondent.occupation || "",
    respondent.industry || "",
    respondent.experience || "",
    respondent.education || "",
    respondent.country || "",
    respondent.expertise || "",
    clientMeta.timezone || "",
    clientMeta.userAgent || "",
    clientMeta.pageUrl || "",
    JSON.stringify(data)
  ];
  metaSheet.appendRow(metaRow);

  const sectionRows = [];
  const comparisonRows = [];

  schemaSections.forEach(function(section) {
    const sectionKey = section.key;
    const sectionResp = isObject(responses[sectionKey]) ? responses[sectionKey] : {};
    const sectionDef = sectionDefMap[sectionKey];
    const itemLabelById = sectionDef.itemLabelById;

    const mostItemId = sectionResp.mostItemId || "";
    const leastItemId = sectionResp.leastItemId || "";
    const mostItemLabel = itemLabelById[mostItemId] || "";
    const leastItemLabel = itemLabelById[leastItemId] || "";

    sectionRows.push([
      nowIso,
      responseId,
      sectionKey,
      section.title || "",
      section.kind || "",
      mostItemId,
      mostItemLabel,
      leastItemId,
      leastItemLabel
    ]);

    const mostVsOther = isObject(sectionResp.comparisonsMostVsOther) ? sectionResp.comparisonsMostVsOther : {};
    Object.keys(mostVsOther).forEach(function(otherItemId) {
      const scaleId = mostVsOther[otherItemId] || "";
      const scaleLabel = scaleDef.byId[scaleId] || "";
      comparisonRows.push([
        nowIso,
        responseId,
        sectionKey,
        "most_vs_other",
        mostItemId,
        mostItemLabel,
        otherItemId,
        itemLabelById[otherItemId] || "",
        scaleId,
        scaleLabel
      ]);
    });

    const otherVsLeast = isObject(sectionResp.comparisonsOtherVsLeast) ? sectionResp.comparisonsOtherVsLeast : {};
    Object.keys(otherVsLeast).forEach(function(otherItemId) {
      const scaleId = otherVsLeast[otherItemId] || "";
      const scaleLabel = scaleDef.byId[scaleId] || "";
      comparisonRows.push([
        nowIso,
        responseId,
        sectionKey,
        "other_vs_least",
        leastItemId,
        leastItemLabel,
        otherItemId,
        itemLabelById[otherItemId] || "",
        scaleId,
        scaleLabel
      ]);
    });
  });

  if (sectionRows.length > 0) {
    sectionsSheet
      .getRange(sectionsSheet.getLastRow() + 1, 1, sectionRows.length, sectionRows[0].length)
      .setValues(sectionRows);
  }

  if (comparisonRows.length > 0) {
    comparisonsSheet
      .getRange(comparisonsSheet.getLastRow() + 1, 1, comparisonRows.length, comparisonRows[0].length)
      .setValues(comparisonRows);
  }

  return {
    mode: "v2",
    message: "Response recorded",
    responseId: responseId
  };
}

function validateV2Payload(data) {
  const errors = [];

  if (!isObject(data)) {
    errors.push("Payload must be a JSON object");
    return errors;
  }

  if (Number(data.schemaVersion || 0) < 2) {
    errors.push("schemaVersion must be >= 2");
  }

  if (!isObject(data.responses)) {
    errors.push("responses must be an object");
  }

  if (!isObject(data.schemaSnapshot)) {
    errors.push("schemaSnapshot is required for v2");
    return errors;
  }

  const sections = Array.isArray(data.schemaSnapshot.sections) ? data.schemaSnapshot.sections : [];
  const scaleOptions = Array.isArray(data.schemaSnapshot.scaleOptions) ? data.schemaSnapshot.scaleOptions : [];

  if (sections.length === 0) {
    errors.push("schemaSnapshot.sections must be a non-empty array");
  }
  if (scaleOptions.length === 0) {
    errors.push("schemaSnapshot.scaleOptions must be a non-empty array");
  }

  const sectionMap = {};
  const scaleSet = {};

  scaleOptions.forEach(function(scale, idx) {
    if (!isObject(scale) || !scale.id) {
      errors.push("Invalid scale option at index " + idx);
      return;
    }
    if (scaleSet[scale.id]) {
      errors.push("Duplicate scale id: " + scale.id);
      return;
    }
    scaleSet[scale.id] = true;
  });

  sections.forEach(function(section, idx) {
    if (!isObject(section) || !section.key) {
      errors.push("Invalid section at index " + idx);
      return;
    }
    if (sectionMap[section.key]) {
      errors.push("Duplicate section key: " + section.key);
      return;
    }
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) {
      errors.push("Section '" + section.key + "' has no items");
      return;
    }
    const itemSet = {};
    items.forEach(function(item, itemIdx) {
      if (!isObject(item) || !item.id) {
        errors.push("Invalid item in section '" + section.key + "' at index " + itemIdx);
        return;
      }
      if (itemSet[item.id]) {
        errors.push("Duplicate item id '" + item.id + "' in section '" + section.key + "'");
        return;
      }
      itemSet[item.id] = true;
    });
    sectionMap[section.key] = itemSet;
  });

  if (isObject(data.responses)) {
    Object.keys(data.responses).forEach(function(sectionKey) {
      if (!sectionMap[sectionKey]) {
        errors.push("Unknown response section key: " + sectionKey);
        return;
      }

      const sectionResp = data.responses[sectionKey];
      if (!isObject(sectionResp)) {
        errors.push("Section response must be an object for key: " + sectionKey);
        return;
      }

      const itemSet = sectionMap[sectionKey];
      const mostItemId = sectionResp.mostItemId || "";
      const leastItemId = sectionResp.leastItemId || "";

      if (mostItemId && !itemSet[mostItemId]) {
        errors.push("Invalid mostItemId '" + mostItemId + "' in section '" + sectionKey + "'");
      }
      if (leastItemId && !itemSet[leastItemId]) {
        errors.push("Invalid leastItemId '" + leastItemId + "' in section '" + sectionKey + "'");
      }
      if (mostItemId && leastItemId && mostItemId === leastItemId) {
        errors.push("mostItemId and leastItemId cannot be the same in section '" + sectionKey + "'");
      }

      validateComparisonMap(sectionResp.comparisonsMostVsOther, sectionKey, itemSet, scaleSet, "comparisonsMostVsOther", errors);
      validateComparisonMap(sectionResp.comparisonsOtherVsLeast, sectionKey, itemSet, scaleSet, "comparisonsOtherVsLeast", errors);
    });
  }

  return errors;
}

function validateComparisonMap(mapValue, sectionKey, itemSet, scaleSet, fieldName, errors) {
  if (mapValue === undefined || mapValue === null) {
    return;
  }
  if (!isObject(mapValue)) {
    errors.push(fieldName + " must be an object in section '" + sectionKey + "'");
    return;
  }

  Object.keys(mapValue).forEach(function(otherItemId) {
    if (!itemSet[otherItemId]) {
      errors.push("Invalid item id '" + otherItemId + "' in " + fieldName + " of section '" + sectionKey + "'");
      return;
    }
    const scaleId = mapValue[otherItemId];
    if (!scaleSet[scaleId]) {
      errors.push("Invalid scale id '" + scaleId + "' in " + fieldName + " of section '" + sectionKey + "'");
    }
  });
}

function buildSectionDefinitionMap(schemaSections) {
  const map = {};
  schemaSections.forEach(function(section) {
    const itemLabelById = {};
    const items = Array.isArray(section.items) ? section.items : [];
    items.forEach(function(item) {
      itemLabelById[item.id] = item.label || "";
    });
    map[section.key] = {
      itemLabelById: itemLabelById
    };
  });
  return map;
}

function buildScaleDefinition(scaleOptions) {
  const byId = {};
  scaleOptions.forEach(function(scale) {
    byId[scale.id] = scale.label || "";
  });
  return { byId: byId };
}

function getV2MetaHeaders() {
  return [
    "Timestamp",
    "ResponseID",
    "SchemaVersion",
    "SurveyID",
    "SurveyVersion",
    "SubmittedAt",
    "StartTime",
    "EndTime",
    "Name",
    "Email",
    "Organization",
    "Occupation",
    "Industry",
    "Experience",
    "Education",
    "Country",
    "Expertise",
    "ClientTimezone",
    "ClientUserAgent",
    "ClientPageURL",
    "RawJSON"
  ];
}

function getV2SectionsHeaders() {
  return [
    "Timestamp",
    "ResponseID",
    "SectionKey",
    "SectionTitle",
    "SectionKind",
    "MostItemID",
    "MostItemLabel",
    "LeastItemID",
    "LeastItemLabel"
  ];
}

function getV2ComparisonsHeaders() {
  return [
    "Timestamp",
    "ResponseID",
    "SectionKey",
    "Direction",
    "AnchorItemID",
    "AnchorItemLabel",
    "OtherItemID",
    "OtherItemLabel",
    "ScaleID",
    "ScaleLabel"
  ];
}

function ensureSheetWithHeaders(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, headers.length).getValues()[0]
    : [];

  const needsHeaderWrite =
    sheet.getLastRow() === 0 ||
    headers.some(function(header, idx) {
      return currentHeaders[idx] !== header;
    });

  if (needsHeaderWrite) {
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ============================================
// LEGACY HANDLER (FIXED COLUMNS)
// ============================================

function handleLegacySubmission(ss, data) {
  let sheet = ss.getSheetByName(LEGACY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LEGACY_SHEET_NAME);
    addLegacyHeaders(sheet);
  }

  if (sheet.getLastRow() === 0) {
    addLegacyHeaders(sheet);
  }

  const rowData = prepareLegacyRowData(data);
  sheet.appendRow(rowData);

  return {
    mode: "legacy",
    message: "Legacy response recorded",
    responseId: rowData[1] || ""
  };
}

function addLegacyHeaders(sheet) {
  const headers = [
    "Timestamp",
    "Response ID",
    "Name",
    "Email",
    "Organization",
    "Occupation",
    "Industry",
    "Experience",
    "Education",
    "Country",
    "Expertise",
    "Start Time",
    "End Time",
    "Main_Most",
    "Main_Least",
    "Main_MostVsOther1",
    "Main_MostVsOther2",
    "Main_MostVsOther3",
    "Main_MostVsOther4",
    "Main_MostVsLeast",
    "Main_Other1VsLeast",
    "Main_Other2VsLeast",
    "Main_Other3VsLeast",
    "Main_Other4VsLeast",
    "Main_MostVsLeast2",
    "Econ_Most",
    "Econ_Least",
    "Econ_MostVsOther1",
    "Econ_MostVsOther2",
    "Econ_MostVsLeast",
    "Econ_Other1VsLeast",
    "Econ_Other2VsLeast",
    "Econ_MostVsLeast2",
    "Env_Most",
    "Env_Least",
    "Env_MostVsOther1",
    "Env_MostVsOther2",
    "Env_MostVsLeast",
    "Env_Other1VsLeast",
    "Env_Other2VsLeast",
    "Env_MostVsLeast2",
    "Tech_Most",
    "Tech_Least",
    "Tech_MostVsOther1",
    "Tech_MostVsOther2",
    "Tech_MostVsLeast",
    "Tech_Other1VsLeast",
    "Tech_Other2VsLeast",
    "Tech_MostVsLeast2",
    "Oper_Most",
    "Oper_Least",
    "Oper_MostVsOther1",
    "Oper_MostVsOther2",
    "Oper_MostVsLeast",
    "Oper_Other1VsLeast",
    "Oper_Other2VsLeast",
    "Oper_MostVsLeast2",
    "Soc_Most",
    "Soc_Least",
    "Soc_MostVsOther1",
    "Soc_MostVsOther2",
    "Soc_MostVsLeast",
    "Soc_Other1VsLeast",
    "Soc_Other2VsLeast",
    "Soc_MostVsLeast2",
    "Pol_Most",
    "Pol_Least",
    "Pol_MostVsOther1",
    "Pol_MostVsOther2",
    "Pol_MostVsLeast",
    "Pol_Other1VsLeast",
    "Pol_Other2VsLeast",
    "Pol_MostVsLeast2"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function prepareLegacyRowData(data) {
  const respondent = isObject(data.respondent) ? data.respondent : {};
  const responses = isObject(data.responses) ? data.responses : {};
  const responseId = Utilities.getUuid();

  function getMainComps(sectionKey) {
    const sectionData = isObject(responses[sectionKey]) ? responses[sectionKey] : {};
    const comps = [];
    for (let i = 0; i < 5; i++) comps.push(sectionData["comp_most_" + i] || "");
    for (let i = 0; i < 5; i++) comps.push(sectionData["comp_least_" + i] || "");
    return comps;
  }

  function getSubComps(sectionKey) {
    const sectionData = isObject(responses[sectionKey]) ? responses[sectionKey] : {};
    const comps = [];
    for (let i = 0; i < 3; i++) comps.push(sectionData["comp_most_" + i] || "");
    for (let i = 0; i < 3; i++) comps.push(sectionData["comp_least_" + i] || "");
    return comps;
  }

  return [
    new Date().toISOString(),
    responseId,
    respondent.name || "",
    respondent.email || "",
    respondent.organization || "",
    respondent.occupation || "",
    respondent.industry || "",
    respondent.experience || "",
    respondent.education || "",
    respondent.country || "",
    respondent.expertise || "",
    respondent.startTime || "",
    respondent.endTime || "",
    (responses.mainCategories || {}).most || "",
    (responses.mainCategories || {}).least || "",
    ...getMainComps("mainCategories"),
    (responses.economic || {}).most || "",
    (responses.economic || {}).least || "",
    ...getSubComps("economic"),
    (responses.environmental || {}).most || "",
    (responses.environmental || {}).least || "",
    ...getSubComps("environmental"),
    (responses.technological || {}).most || "",
    (responses.technological || {}).least || "",
    ...getSubComps("technological"),
    (responses.operational || {}).most || "",
    (responses.operational || {}).least || "",
    ...getSubComps("operational"),
    (responses.social || {}).most || "",
    (responses.social || {}).least || "",
    ...getSubComps("social"),
    (responses.policy || {}).most || "",
    (responses.policy || {}).least || "",
    ...getSubComps("policy")
  ];
}

// ============================================
// TEST HELPERS
// ============================================

function testScriptLegacy() {
  const testData = {
    respondent: {
      occupation: "Researcher",
      industry: "Academia/Research",
      experience: "3-5",
      education: "Master's",
      country: "Germany",
      expertise: "Transport policy",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    },
    responses: {
      mainCategories: {
        most: "Economic",
        least: "Social",
        comp_most_0: "Significantly more",
        comp_most_1: "Moderately more",
        comp_most_2: "Slightly more",
        comp_most_3: "Extremely more",
        comp_most_4: "Significantly more",
        comp_least_0: "Extremely more",
        comp_least_1: "Moderately more",
        comp_least_2: "Significantly more",
        comp_least_3: "Slightly more",
        comp_least_4: "Moderately more"
      }
    }
  };
  const row = prepareLegacyRowData(testData);
  Logger.log("Legacy row length: " + row.length);
}

function testScriptV2() {
  const testData = {
    schemaVersion: 2,
    surveyId: "bw_online_survey",
    surveyVersion: "2026-02",
    submittedAt: new Date().toISOString(),
    respondent: {
      occupation: "Researcher",
      industry: "Academia/Research",
      experience: "3-5",
      education: "Master's",
      country: "Germany",
      expertise: "Transport policy",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    },
    schemaSnapshot: {
      sections: [
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
            { id: "policy", label: "Policy" }
          ]
        }
      ],
      scaleOptions: [
        { id: "slightly_more", label: "Slightly more challenging" },
        { id: "moderately_more", label: "Moderately more challenging" },
        { id: "significantly_more", label: "Significantly more challenging" },
        { id: "extremely_more", label: "Extremely more challenging" }
      ]
    },
    responses: {
      mainCategories: {
        mostItemId: "economic",
        leastItemId: "social",
        comparisonsMostVsOther: {
          environmental: "significantly_more",
          technological: "moderately_more",
          operational: "slightly_more",
          social: "extremely_more",
          policy: "significantly_more"
        },
        comparisonsOtherVsLeast: {
          environmental: "moderately_more",
          technological: "significantly_more",
          operational: "slightly_more",
          policy: "moderately_more"
        }
      }
    }
  };

  const errors = validateV2Payload(testData);
  if (errors.length > 0) {
    Logger.log("V2 validation errors: " + errors.join(" | "));
  } else {
    Logger.log("V2 payload validates successfully");
  }
}
