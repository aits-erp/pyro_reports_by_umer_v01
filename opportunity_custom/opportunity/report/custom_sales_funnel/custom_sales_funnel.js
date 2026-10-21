
frappe.query_reports["Sales Funnel Report"] = {
    filters: [
        {
            fieldname: "from_date",
            label: "From Date",
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.month_start()
        },
        {
            fieldname: "to_date",
            label: "To Date",
            fieldtype: "Date",
            reqd: 1,
            default: frappe.datetime.get_today()
        }
    ],

    onload: function(report) {
        report.page.add_inner_button("Refresh Funnel", function() {
            report.refresh();
        });
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
                 style="margin:20px 0;padding:15px;
                        background:var(--card-bg);
                        border-radius:8px;">
            </div>
        `);

        wrapper.find(".datatable").first().before(container);
    }

    const rows = report.data || [];

    if (!rows.length) {
        container.empty();
        return;
    }

    const colors = [
        "#b33b4a",
        "#f59e00",
        "#087e9b",
        "#00a878",
        "#747b86"
    ];

    const width = 900;
    const center = width / 2;
    const topWidth = 840;
    const stageHeight = 100;

    const maxCount = Math.max(
        1,
        ...rows.map(row => Number(row.count || 0))
    );

    let svg = `
        <svg viewBox="0 0 ${width} ${rows.length * stageHeight + 20}"
             style="width:100%;max-width:1100px;display:block;margin:auto;">
    `;

    rows.forEach((row, index) => {
        const y = index * stageHeight + 10;
        const top = topWidth * (1 - index / rows.length * 0.72);
        const bottom = topWidth * (1 - (index + 1) / rows.length * 0.72);

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

        svg += `
            <polygon points="${points}"
                     fill="${colors[index % colors.length]}"
                     stroke="white"
                     stroke-width="1">
                <title>${frappe.utils.escape_html(row.stage)}: ${count}</title>
            </polygon>

            <line x1="${center + bottom / 2}"
                  y1="${y + stageHeight / 2}"
                  x2="${center + bottom / 2 + 30}"
                  y2="${y + stageHeight / 2}"
                  stroke="${colors[index % colors.length]}"
                  stroke-width="2"/>

            <text x="${center + bottom / 2 + 40}"
                  y="${y + stageHeight / 2 - 5}"
                  font-size="15"
                  fill="var(--text-color)">
                ${frappe.utils.escape_html(row.stage)}: ${count}
            </text>

            <text x="${center + bottom / 2 + 40}"
                  y="${y + stageHeight / 2 + 16}"
                  font-size="12"
                  fill="var(--text-muted)">
                Offer Value: ${format_currency(offerValue)}
            </text>
        `;
    });

    svg += `</svg>`;

    container.html(svg);
}

function format_currency(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
    }).format(value);
}
