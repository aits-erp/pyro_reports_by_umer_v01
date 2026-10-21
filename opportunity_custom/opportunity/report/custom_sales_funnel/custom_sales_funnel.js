
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
        setTimeout(function() {
            render_sales_funnel(report);
        }, 700);
    },

    after_datatable_render: function(report) {
        render_sales_funnel(report);
    }
};


function render_sales_funnel(report) {
    const wrapper = report.page.wrapper;

    // Create a dedicated container for the chart.
    let container = wrapper.find("#custom-sales-funnel");

    if (!container.length) {
        container = $(`
            <div id="custom-sales-funnel"
                 style="width:100%; padding:15px 0; overflow-x:auto;">
            </div>
        `);

        const reportArea = wrapper.find(".report-wrapper").first();

        if (reportArea.length) {
            reportArea.prepend(container);
        } else {
            wrapper.find(".layout-main-section").first().prepend(container);
        }
    }

    const rows = (report.data || []).filter(function(row) {
        return row.stage &&
            ["Active Leads", "Opportunities", "Quotation", "Converted", "Lost"]
                .includes(row.stage);
    });

    if (!rows.length) {
        container.html(`
            <div style="padding:30px;text-align:center;">
                ${__("No funnel data found for the selected dates.")}
            </div>
        `);
        return;
    }

    // Hide the normal data table to match the standard funnel layout.
    wrapper.find(".report-wrapper .datatable").hide();

    const colors = [
        "#b33b4a",
        "#f59e00",
        "#087e9b",
        "#00a878",
        "#747b86"
    ];

    const width = 1200;
    const heightPerStage = 125;
    const chartHeight = rows.length * heightPerStage + 20;
    const center = 420;
    const maxWidth = 820;
    const taper = 0.82;

    let svg = `
        <svg viewBox="0 0 ${width} ${chartHeight}"
             style="width:100%;min-width:850px;display:block;"
             role="img"
             aria-label="Sales Funnel">
    `;

    rows.forEach(function(row, index) {
        const y = index * heightPerStage + 10;

        const topWidth = maxWidth *
            (1 - (index / rows.length) * taper);

        const bottomWidth = maxWidth *
            (1 - ((index + 1) / rows.length) * taper);

        const topLeft = center - topWidth / 2;
        const topRight = center + topWidth / 2;
        const bottomLeft = center - bottomWidth / 2;
        const bottomRight = center + bottomWidth / 2;

        const labelY = y + heightPerStage / 2;
        const color = colors[index % colors.length];
        const count = Number(row.count || 0);
        const value = Number(row.offer_value || 0);

        const points = [
            `${topLeft},${y}`,
            `${topRight},${y}`,
            `${bottomRight},${y + heightPerStage}`,
            `${bottomLeft},${y + heightPerStage}`
        ].join(" ");

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
                x2="${center + bottomWidth / 2 + 40}"
                y2="${labelY}"
                stroke="${color}"
                stroke-width="1.5" />

            <circle
                cx="${center + bottomWidth / 2 + 40}"
                cy="${labelY}"
                r="5"
                fill="${color}" />

            <text
                x="${center + bottomWidth / 2 + 60}"
                y="${labelY - 4}"
                font-size="15"
                fill="var(--text-color)">
                ${escape_funnel_text(row.stage)}: ${count}
            </text>

            <text
                x="${center + bottomWidth / 2 + 60}"
                y="${labelY + 17}"
                font-size="12"
                fill="var(--text-muted)">
                Offer Value: ${format_funnel_currency(value)}
            </text>
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


function format_funnel_currency(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}
