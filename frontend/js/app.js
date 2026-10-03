"use strict";

console.log("CYBERTRACE JS LOADED");


/* =========================================
   CONFIGURATION
========================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

let currentCaseId = null;


/* =========================================
   HELPER
========================================= */

const $ = (id) => document.getElementById(id);


/* =========================================
   ELEMENTS
========================================= */

const newCaseButton = $("newCaseButton");

const caseModal = $("caseModal");
const closeCaseModal = $("closeCaseModal");
const cancelCase = $("cancelCase");

const caseForm = $("caseForm");
const createCaseButton = $("createCaseButton");

const refreshCasesButton = $("refreshCasesButton");

const investigationPanel = $("investigationPanel");
const closeInvestigation = $("closeInvestigation");

const evidenceButton = $("evidenceButton");

const evidencePanel = $("evidencePanel");
const closeEvidence = $("closeEvidence");

const addEvidenceButton = $("addEvidenceButton");

const timelineButton = $("timelineButton");
const eventAnalysisButton = $("eventAnalysisButton");
const reportButton = $("reportButton");


/* =========================================
   CASE MODAL
========================================= */

function openCaseModal() {

    if (!caseModal) {
        return;
    }

    caseModal.classList.add("visible");

    caseModal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(() => {

        $("caseName")?.focus();

    }, 100);
}


function closeCaseModalWindow() {

    if (!caseModal) {
        return;
    }

    caseModal.classList.remove("visible");

    caseModal.setAttribute(
        "aria-hidden",
        "true"
    );
}


newCaseButton?.addEventListener(
    "click",
    openCaseModal
);


closeCaseModal?.addEventListener(
    "click",
    closeCaseModalWindow
);


cancelCase?.addEventListener(
    "click",
    closeCaseModalWindow
);


caseModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target === caseModal
        ) {

            closeCaseModalWindow();

        }

    }
);


/* =========================================
   CREATE INVESTIGATION
========================================= */

caseForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const caseName =
            $("caseName")?.value.trim();

        const caseDescription =
            $("caseDescription")?.value.trim();

        const investigator =
            $("investigator")?.value.trim();

        const priority =
            $("priority")?.value;


        if (
            !caseName ||
            !caseDescription ||
            !investigator ||
            !priority
        ) {

            alert(
                "Please complete all investigation fields."
            );

            return;
        }


        const caseData = {

            case_name: caseName,

            description: caseDescription,

            investigator: investigator,

            priority: priority

        };


        setButtonBusy(
            createCaseButton,
            true,
            "Creating..."
        );


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/cases`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(caseData)

                    }
                );


            const result =
                await readJson(response);


            if (
                !response.ok ||
                result.status !== "success"
            ) {

                throw new Error(
                    result.message ||
                    "Failed to create investigation."
                );

            }


            caseForm.reset();

            closeCaseModalWindow();


            await loadCases();


            alert(
                "Investigation created successfully."
            );


            if (result.case?.id) {

                await viewCase(
                    result.case.id
                );

            }

        }
        catch (error) {

            console.error(
                "Create case error:",
                error
            );


            alert(
                "Unable to create investigation.\n\n" +
                "Make sure the CyberTrace backend is running on port 8000."
            );

        }
        finally {

            setButtonBusy(
                createCaseButton,
                false,
                "Create Investigation"
            );

        }

    }
);


/* =========================================
   LOAD CASES
========================================= */

async function loadCases() {

    const caseList =
        document.getElementById("caseList");


    if (!caseList) {
        return;
    }


    caseList.innerHTML = `
        <div class="loading-state">
            Loading investigations...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/cases`
            );


        const data =
            await readJson(response);


        if (
            !response.ok ||
            data.status !== "success"
        ) {

            throw new Error(
                data.message ||
                "Unable to load investigations."
            );

        }


        const cases =
            Array.isArray(data.cases)
                ? data.cases
                : [];


        caseList.innerHTML = "";


        if (cases.length === 0) {

            caseList.innerHTML = `
                <div class="empty-state">

                    <strong>
                        No investigations found
                    </strong>

                    <p>
                        Create a new investigation to begin.
                    </p>

                </div>
            `;

        }
        else {

            cases.forEach(
                (caseItem) => {

                    const caseElement =
                        document.createElement(
                            "div"
                        );


                    caseElement.className =
                        "case-item";


                    caseElement.innerHTML = `

                        <div class="case-icon">

                            ${String(
                                caseItem.id
                            ).padStart(2, "0")}

                        </div>


                        <div class="case-information">

                            <h3>
                                ${escapeHTML(
                                    caseItem.case_name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    caseItem.description
                                )}
                            </p>

                            <small>

                                Case #${caseItem.id}

                                · Investigator:

                                ${escapeHTML(
                                    caseItem.investigator
                                )}

                            </small>

                        </div>


                        <span
                            class="case-status
                            ${getPriorityClass(
                                caseItem.priority
                            )}"
                        >

                            ${escapeHTML(
                                caseItem.priority
                            )}

                        </span>


                        <button
                            class="view-case-button"
                            type="button"
                        >
                            View Investigation
                        </button>

                    `;


                    const viewButton =
                        caseElement.querySelector(
                            ".view-case-button"
                        );


                    viewButton?.addEventListener(
                        "click",
                        () => {

                            viewCase(
                                caseItem.id
                            );

                        }
                    );


                    caseList.appendChild(
                        caseElement
                    );

                }
            );

        }


        updateStatistics(cases);

    }
    catch (error) {

        console.error(
            "Load cases error:",
            error
        );


        caseList.innerHTML = `

            <div class="error-state">

                <strong>
                    Unable to load investigations
                </strong>

                <p>
                    Check that the CyberTrace backend is running.
                </p>

                <button
                    id="retryCasesButton"
                    class="retry-button"
                    type="button"
                >
                    Retry
                </button>

            </div>

        `;


        $("retryCasesButton")?.addEventListener(
            "click",
            loadCases
        );

    }

}


/* =========================================
   PRIORITY CLASS
========================================= */

function getPriorityClass(priority) {

    const value =
        String(priority || "")
            .toLowerCase();


    if (
        value === "critical" ||
        value === "high"
    ) {

        return "open";

    }


    if (value === "low") {

        return "resolved";

    }


    return "investigating";

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics(cases) {

    const activeCasesCount =
        $("activeCasesCount");


    const highPriorityCount =
        $("highPriorityCount");


    const highPriorityCases =
        cases.filter(
            (caseItem) =>

                caseItem.priority === "High" ||

                caseItem.priority === "Critical"
        );


    if (activeCasesCount) {

        activeCasesCount.textContent =
            String(
                cases.length
            ).padStart(2, "0");

    }


    if (highPriorityCount) {

        highPriorityCount.textContent =
            String(
                highPriorityCases.length
            ).padStart(2, "0");

    }

}


/* =========================================
   VIEW INVESTIGATION
========================================= */

async function viewCase(caseId) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/cases`
            );


        const data =
            await readJson(response);


        if (
            !response.ok ||
            data.status !== "success"
        ) {

            throw new Error(
                "Unable to load cases."
            );

        }


        const selectedCase =
            data.cases.find(
                (item) =>
                    Number(item.id) ===
                    Number(caseId)
            );


        if (!selectedCase) {

            alert(
                "Investigation not found."
            );

            return;
        }


        currentCaseId =
            Number(selectedCase.id);


        $("investigationTitle")
            .textContent =
            selectedCase.case_name;


        $("investigationId")
            .textContent =
            `#${selectedCase.id}`;


        $("investigationInvestigator")
            .textContent =
            selectedCase.investigator;


        $("investigationPriority")
            .textContent =
            selectedCase.priority;


        $("investigationStatus")
            .textContent =
            "OPEN";


        $("investigationDescription")
            .textContent =
            selectedCase.description;


        investigationPanel?.classList.add(
            "visible"
        );


        investigationPanel?.setAttribute(
            "aria-hidden",
            "false"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
    catch (error) {

        console.error(
            "View case error:",
            error
        );


        alert(
            "Unable to open investigation."
        );

    }

}


/* =========================================
   CLOSE INVESTIGATION
========================================= */

function closeInvestigationPanel() {

    investigationPanel?.classList.remove(
        "visible"
    );


    investigationPanel?.setAttribute(
        "aria-hidden",
        "true"
    );

}


closeInvestigation?.addEventListener(
    "click",
    closeInvestigationPanel
);


/* =========================================
   EVIDENCE PANEL
========================================= */

evidenceButton?.addEventListener(
    "click",
    async () => {

        if (!currentCaseId) {

            alert(
                "Please open an investigation first."
            );

            return;
        }


        await loadEvidence(
            currentCaseId
        );


        evidencePanel?.classList.add(
            "visible"
        );


        evidencePanel?.setAttribute(
            "aria-hidden",
            "false"
        );

    }
);


closeEvidence?.addEventListener(
    "click",
    closeEvidencePanel
);


function closeEvidencePanel() {

    evidencePanel?.classList.remove(
        "visible"
    );


    evidencePanel?.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================
   LOAD EVIDENCE
========================================= */

async function loadEvidence(caseId) {

    const evidenceList =
        $("evidenceList");


    if (!evidenceList) {
        return;
    }


    evidenceList.innerHTML = `
        <div class="loading-state">
            Loading evidence...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/evidence/${caseId}`
            );


        const data =
            await readJson(response);


        if (
            !response.ok ||
            data.status !== "success"
        ) {

            throw new Error(
                data.message ||
                "Unable to load evidence."
            );

        }


        const evidence =
            Array.isArray(data.evidence)
                ? data.evidence
                : [];


        $("evidenceCaseId")
            .textContent =
            `#${caseId}`;


        $("evidenceCount")
            .textContent =
            evidence.length;


        $("evidenceCaseStatus")
            .textContent =
            "ACTIVE";


        $("evidenceIntegrity")
            .textContent =
            evidence.every(
                isValidHash
            )
                ? "VERIFIED"
                : "REVIEW";


        evidenceList.innerHTML = "";


        if (evidence.length === 0) {

            evidenceList.innerHTML = `

                <div class="empty-state">

                    <strong>
                        No evidence collected
                    </strong>

                    <p>
                        Add evidence to begin forensic analysis.
                    </p>

                </div>

            `;

            return;
        }


        evidence.forEach(
            (item) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "activity evidence-item";


                element.tabIndex = 0;


                element.innerHTML = `

                    <time class="activity-time">
                        #${item.id}
                    </time>


                    <div>

                        <strong>
                            ${escapeHTML(
                                item.evidence_name
                            )}
                        </strong>


                        <p>

                            ${escapeHTML(
                                item.evidence_type
                            )}

                            ·

                            ${escapeHTML(
                                item.status
                            )}

                        </p>


                        <small>

                            Collected by
                            ${escapeHTML(
                                item.collected_by
                            )}

                            ·

                            ${escapeHTML(
                                item.collected_at
                            )}

                        </small>

                    </div>

                `;


                element.addEventListener(
                    "click",
                    () => {

                        showEvidenceDetails(
                            item
                        );

                    }
                );


                evidenceList.appendChild(
                    element
                );

            }
        );


        $("totalEvidenceCount")
            .textContent =
            String(
                evidence.length
            ).padStart(2, "0");

    }
    catch (error) {

        console.error(
            "Evidence error:",
            error
        );


        evidenceList.innerHTML = `

            <div class="error-state">

                <strong>
                    Unable to load evidence
                </strong>

                <p>
                    Check the backend connection.
                </p>

            </div>

        `;

    }

}


/* =========================================
   EVIDENCE DETAILS
========================================= */

function showEvidenceDetails(item) {

    const evidenceDetails =
        $("evidenceDetails");


    if (!evidenceDetails) {
        return;
    }


    evidenceDetails.innerHTML = `

        <div class="section-heading">

            <span class="panel-kicker">
                FORENSIC DETAILS
            </span>

            <h3>
                Evidence Details
            </h3>

        </div>


        <div class="activity-list">

            ${detailRow(
                "Evidence Name",
                item.evidence_name
            )}

            ${detailRow(
                "Evidence Type",
                item.evidence_type
            )}

            ${detailRow(
                "Collected By",
                item.collected_by
            )}

            ${detailRow(
                "Collected At",
                item.collected_at
            )}

            ${detailRow(
                "Status",
                item.status
            )}

            ${detailRow(
                "SHA-256 Hash",
                item.sha256_hash,
                true
            )}

            ${detailRow(
                "Notes",
                item.notes || "None"
            )}

        </div>

    `;

}


function detailRow(
    label,
    value,
    breakWord = false
) {

    return `

        <div class="activity">

            <div>

                <strong>
                    ${escapeHTML(label)}
                </strong>

                <p
                    ${breakWord
                        ? 'class="hash-value"'
                        : ""}
                >
                    ${escapeHTML(value)}
                </p>

            </div>

        </div>

    `;

}


/* =========================================
   ADD EVIDENCE
========================================= */

addEvidenceButton?.addEventListener(
    "click",
    () => {

        if (!currentCaseId) {

            alert(
                "Please open an investigation first."
            );

            return;
        }


        openEvidenceForm();

    }
);


function openEvidenceForm() {

    document
        .getElementById(
            "evidenceFormOverlay"
        )
        ?.remove();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "evidenceFormOverlay";


    overlay.className =
        "modal-overlay visible";


    overlay.innerHTML = `

        <section
            class="case-modal"
            role="dialog"
            aria-modal="true"
        >

            <header class="modal-header">

                <div>

                    <span class="panel-kicker">
                        DIGITAL FORENSICS
                    </span>

                    <h2>
                        Add Evidence
                    </h2>

                </div>


                <button
                    type="button"
                    class="close-modal"
                    id="closeEvidenceForm"
                >
                    ×
                </button>

            </header>


            <form id="evidenceForm">

                <label>
                    Evidence Name
                </label>

                <input
                    type="text"
                    id="evidenceName"
                    placeholder="Example: Authentication Log"
                    required
                >


                <label>
                    Evidence Type
                </label>

                <select
                    id="evidenceType"
                    required
                >

                    <option value="">
                        Select evidence type
                    </option>

                    <option>
                        Security Log
                    </option>

                    <option>
                        Network Log
                    </option>

                    <option>
                        System Log
                    </option>

                    <option>
                        File
                    </option>

                    <option>
                        Email
                    </option>

                    <option>
                        Metadata
                    </option>

                    <option>
                        Other
                    </option>

                </select>


                <label>
                    Collected By
                </label>

                <input
                    type="text"
                    id="evidenceCollectedBy"
                    required
                >


                <label>
                    Collected At
                </label>

                <input
                    type="datetime-local"
                    id="evidenceCollectedAt"
                    required
                >


                <label>
                    SHA-256 Hash
                </label>

                <input
                    type="text"
                    id="evidenceHash"
                    maxlength="64"
                    minlength="64"
                    pattern="[A-Fa-f0-9]{64}"
                    placeholder="64-character SHA-256 hash"
                    required
                >


                <label>
                    Status
                </label>

                <select
                    id="evidenceStatus"
                    required
                >

                    <option>
                        Collected
                    </option>

                    <option>
                        Under Review
                    </option>

                    <option>
                        Analyzed
                    </option>

                    <option>
                        Archived
                    </option>

                </select>


                <label>
                    Notes
                </label>

                <textarea
                    id="evidenceNotes"
                    rows="4"
                    placeholder="Enter forensic notes"
                ></textarea>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="cancel-button"
                        id="cancelEvidenceForm"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="create-button"
                        id="submitEvidenceButton"
                    >
                        Add Evidence
                    </button>

                </div>

            </form>

        </section>

    `;


    document.body.appendChild(
        overlay
    );


    const now =
        new Date();


    const localDateTime =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() *
            60000
        )
            .toISOString()
            .slice(0, 16);


    $("evidenceCollectedAt")
        .value =
        localDateTime;


    $("evidenceCollectedBy")
        .value =
        $("investigationInvestigator")
            ?.textContent
            .trim() || "";


    const closeForm =
        () => overlay.remove();


    $("closeEvidenceForm")
        ?.addEventListener(
            "click",
            closeForm
        );


    $("cancelEvidenceForm")
        ?.addEventListener(
            "click",
            closeForm
        );


    overlay.addEventListener(
        "click",
        (event) => {

            if (
                event.target === overlay
            ) {

                closeForm();

            }

        }
    );


    $("evidenceForm")
        ?.addEventListener(
            "submit",
            submitEvidence
        );


    setTimeout(
        () =>
            $("evidenceName")?.focus(),
        100
    );

}


/* =========================================
   SUBMIT EVIDENCE
========================================= */

async function submitEvidence(event) {

    event.preventDefault();


    if (!currentCaseId) {

        alert(
            "No investigation selected."
        );

        return;
    }


    const evidenceData = {

        case_id:
            currentCaseId,

        evidence_name:
            $("evidenceName")
                ?.value
                .trim(),

        evidence_type:
            $("evidenceType")
                ?.value,

        collected_by:
            $("evidenceCollectedBy")
                ?.value
                .trim(),

        collected_at:
            $("evidenceCollectedAt")
                ?.value,

        sha256_hash:
            $("evidenceHash")
                ?.value
                .trim(),

        status:
            $("evidenceStatus")
                ?.value,

        notes:
            $("evidenceNotes")
                ?.value
                .trim()

    };


    if (
        !evidenceData.evidence_name ||
        !evidenceData.evidence_type ||
        !evidenceData.collected_by ||
        !evidenceData.collected_at ||
        !evidenceData.sha256_hash ||
        !evidenceData.status
    ) {

        alert(
            "Please complete all required evidence fields."
        );

        return;
    }


    if (
        !/^[a-fA-F0-9]{64}$/
            .test(
                evidenceData.sha256_hash
            )
    ) {

        alert(
            "SHA-256 hash must contain exactly 64 hexadecimal characters."
        );

        return;
    }


    const submitButton =
        $("submitEvidenceButton");


    setButtonBusy(
        submitButton,
        true,
        "Adding..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/evidence`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            evidenceData
                        )

                }
            );


        const result =
            await readJson(
                response
            );


        if (
            !response.ok ||
            result.status !== "success"
        ) {

            throw new Error(
                result.message ||
                "Failed to add evidence."
            );

        }


        document
            .getElementById(
                "evidenceFormOverlay"
            )
            ?.remove();


        await loadEvidence(
            currentCaseId
        );


        alert(
            "Evidence added successfully."
        );

    }
    catch (error) {

        console.error(
            "Add evidence error:",
            error
        );


        alert(
            "Unable to add evidence. " +
            "Check that the backend is running."
        );

    }
    finally {

        setButtonBusy(
            submitButton,
            false,
            "Add Evidence"
        );

    }

}


/* =========================================
   OTHER MODULES
========================================= */

timelineButton?.addEventListener(
    "click",
    () => {

        alert(
            "Timeline module is ready for development."
        );

    }
);


eventAnalysisButton?.addEventListener(
    "click",
    () => {

        alert(
            "Event Analysis module is ready for development."
        );

    }
);


reportButton?.addEventListener(
    "click",
    () => {

        alert(
            "Report Generation module is ready for development."
        );

    }
);


/* =========================================
   REFRESH
========================================= */

refreshCasesButton?.addEventListener(
    "click",
    loadCases
);


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") {
            return;
        }


        const evidenceForm =
            $("evidenceFormOverlay");


        if (evidenceForm) {

            evidenceForm.remove();

            return;
        }


        if (
            caseModal?.classList.contains(
                "visible"
            )
        ) {

            closeCaseModalWindow();

            return;
        }


        if (
            evidencePanel?.classList.contains(
                "visible"
            )
        ) {

            closeEvidencePanel();

            return;
        }


        if (
            investigationPanel?.classList.contains(
                "visible"
            )
        ) {

            closeInvestigationPanel();

        }

    }
);


/* =========================================
   UTILITIES
========================================= */

async function readJson(response) {

    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {

        return JSON.parse(text);

    }
    catch {

        throw new Error(
            `Invalid server response (${response.status})`
        );

    }

}


function setButtonBusy(
    button,
    busy,
    text
) {

    if (!button) {
        return;
    }


    if (busy) {

        button.dataset.originalText =
            button.textContent;

        button.disabled = true;

        button.textContent =
            text;

    }
    else {

        button.disabled = false;

        button.textContent =
            text ||
            button.dataset.originalText ||
            "";

    }

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function isValidHash(item) {

    return /^[a-fA-F0-9]{64}$/
        .test(
            String(
                item.sha256_hash || ""
            )
        );

}


/* =========================================
   START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCases();

    }
);