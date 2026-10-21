
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

    refresh: function(report) {
        // Schedule rendering after the report data has refreshed.
        setTimeout(function() {
            render_sales_funnel(report);
        }, 300);
    },

    after_datatable_render: function(report) {
        render_sales_funnel(report);
    }
};


function render_sales_funnel(report) {
    const wrapper = report.page.wrapper;

    let container = wrapper.find("#custom-sales-funnel");

    if (!container.length) {
        container = $(`
            <div id="custom-sales-funnel"
                 style="
                    margin: 20px 0;
                    padding: 15px;
                    background: var(--card-bg);
                    border-radius: 8px;
                    overflow-x: auto;
                 ">
            </div>
        `);

        const datatable = wrapper.find(".datatable").first();

        if (datatable.length) {
            datatable.before(container);
        } else {
            wrapper.find(".report-wrapper").first().prepend(container);
        }
    }

    const rows = (report.data || []).filter(function(row) {
        return row.stage && row.stage !== "Total";
    });

    if (!rows.length) {
        container.html(
            `<div style="padding:20px;text-align:center;color:var(--text-muted)">
                ${__("No funnel data available. Please select dates and refresh.")}
            </div>`
        );
        return;
    }

    const colors = [
        "#b33b4a", // Active Leads
        "#f59e00", // Opportunities
        "#087e9b", // Quotation
        "#00a878", // Converted
        "#747b86"  // Lost
    ];

    const width = 1100;
    const chartHeight = 480;
    const center = 400;
    const topWidth = 700;
    const stageHeight = chartHeight / rows.length;
    const taper = 0.78;

    let svg = `
        <svg
            viewBox="0 0 ${width} ${chartHeight + 20}"
            role="img"
            aria-label="${__("Sales Funnel")}"
            style="width:100%;min-width:700px;display:block;"
        >
    `;

    rows.forEach(function(row, index) {
        const y = index * stageHeight + 10;

        // Each stage tapers toward the bottom.
        const top = topWidth * (
            1 - (index / rows.length) * taper
        );

        const bottom = topWidth * (
            1 - ((index + 1) / rows.length) * taper
        );

        const topLeft = center - top / 2;
        const topRight = center + top / 2;
        const bottomLeft = center - bottom / 2;
        const bottomRight = center + bottom / 2;

        const points = [
            `${topLeft},${y}`,
            `${topRight},${y}`,
            `${bottomRight},${y + stageHeight}`,
            `${bottomLeft},${y + stageHeight}`
        ].join(" ");

        const count = Number(row.count || 0);
        const offerValue = Number(row.offer_value || 0);
        const color = colors[index % colors.length];
        const labelY = y + stageHeight / 2;

        svg += `
            <polygon
                points="${points}"
                fill="${color}"
                stroke="white"
                stroke-width="1"
            >
                <title>${escape_funnel_text(row.stage)}: ${count}</title>
            </polygon>

            <line
                x1="${center + bottom / 2}"
                y1="${labelY}"
                x2="${center + bottom / 2 + 35}"
                y2="${labelY}"
                stroke="${color}"
                stroke-width="2"
            />

            <circle
                cx="${center + bottom / 2 + 35}"
                cy="${labelY}"
                r="5"
                fill="${color}"
            />

            <text
                x="${center + bottom / 2 + 55}"
                y="${labelY - 5}"
                font-size="15"
                fill="var(--text-color)"
            >${escape_funnel_text(row.stage)}: ${count}</text>

            <text
                x="${center + bottom / 2 + 55}"
                y="${labelY + 16}"
                font-size="12"
                fill="var(--text-muted)"
            >Offer Value: ${format_currency(offerValue)}</text>
        `;
    });

    svg += `</svg>`;

    container.html(svg);
}


function escape_funnel_text(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function format_currency(value) {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}
