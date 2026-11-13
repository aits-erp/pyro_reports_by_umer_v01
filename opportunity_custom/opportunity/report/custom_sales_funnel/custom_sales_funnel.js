
frappe.query_reports["Custom Sales Funnel"] = {
    filters: [
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.month_start()
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.get_today()
        }
    ],

    onload: function(report) {
        report.page.add_inner_button(__("Refresh Funnel"), function() {
            report.refresh();
        });
    },

    // IMPORTANT: This argument is the DataTable, not the report.
    after_datatable_render: function(datatable_obj) {
        render_sales_funnel();
    }
};


function render_sales_funnel() {

    const report = frappe.query_report;

    if (!report) {
        console.error("Sales Funnel: Query Report instance not found");
        return;
    }

    // Get actual report data from Frappe.
    const rows = (report.data || []).filter(row =>
        row.stage &&
        [
            "Active Leads",
            "Opportunities",
            "Quotation",
            "Converted",
            "Lost"
        ].includes(row.stage)
    );

    console.log("Sales Funnel Data:", rows);

    // Find the original Frappe report table.
    const reportTable = report.$report;

    if (!reportTable || !reportTable.length) {
        console.error("Sales Funnel: Report table container not found");
        return;
    }

    // Create chart container once.
    let container = report.page.wrapper.find("#custom-sales-funnel");

    if (!container.length) {
        container = $(`
            <div id="custom-sales-funnel"
                 style="
                    width:100%;
                    padding:20px 10px;
                    background:var(--card-bg);
                    overflow-x:auto;
                 ">
            </div>
        `);

        reportTable.before(container);
    }

    if (!rows.length) {
        container.html(`
            <div style="padding:30px;text-align:center;">
                No funnel data available.
            </div>
        `);
        return;
    }

    const colors = [
        "#b33b4a",
        "#f59e00",
        "#087e9b",
        "#00a878",
        "#747b86"
    ];

    const width = 1200;
    const center = 420;
    const maxWidth = 820;
    const stageHeight = 125;
    const chartHeight = rows.length * stageHeight + 20;
    const taper = 0.82;

    let svg = `
        <svg viewBox="0 0 ${width} ${chartHeight}"
             style="width:100%;min-width:850px;display:block;"
             role="img"
             aria-label="Sales Funnel">
    `;

    rows.forEach((row, index) => {

        const y = index * stageHeight + 10;

        const topWidth = maxWidth *
            (1 - (index / rows.length) * taper);

        const bottomWidth = maxWidth *
            (1 - ((index + 1) / rows.length) * taper);

        const topLeft = center - topWidth / 2;
        const topRight = center + topWidth / 2;
        const bottomLeft = center - bottomWidth / 2;
        const bottomRight = center + bottomWidth / 2;

        const labelY = y + stageHeight / 2;
        const color = colors[index % colors.length];

        const count = Number(row.count || 0);
        const value = Number(row.offer_value || 0);

        const points = [
            `${topLeft},${y}`,
            `${topRight},${y}`,
            `${bottomRight},${y + stageHeight}`,
            `${bottomLeft},${y + stageHeight}`
        ].join(" ");

        const labelX = center + bottomWidth / 2 + 55;

        svg += `
            <polygon
                points="${points}"
                fill="${color}"
                stroke="white"
                stroke-width="1">
                <title>${escape_funnel_text(row.stage)}: ${count}</title>
            </polygon>

            <line
                x1="${center + bottomWidth / 2}"
                y1="${labelY}"
                x2="${labelX - 15}"
                y2="${labelY}"
                stroke="${color}"
                stroke-width="1.5"/>

            <circle
                cx="${labelX - 15}"
                cy="${labelY}"
                r="5"
                fill="${color}"/>

            <text
                x="${labelX}"
                y="${labelY - 5}"
                font-size="15"
                fill="var(--text-color)">
                ${escape_funnel_text(row.stage)}: ${count}
            </text>

            <text
                x="${labelX}"
                y="${labelY + 17}"
                font-size="12"
                fill="var(--text-muted)">
                Offer Value: ${format_funnel_currency(value)}
            </text>
        `;
    });

    svg += `</svg>`;

    // Display funnel and hide the original table.
    container.html(svg);
    reportTable.hide();
}


function escape_funnel_text(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function format_funnel_currency(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}
