frappe.query_reports["Daily Follow Up"] = {
    filters: [
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: frappe.datetime.month_start(),
            reqd: 1
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: frappe.datetime.month_end(),
            reqd: 1
        },
        {
            fieldname: "sales_person",
            label: __("Sales Person"),
            fieldtype: "Link",
            options: "Sales Person"
        }
    ],

    get_datatable_options(options) {
        delete options.cellHeight;

        return Object.assign(options, {
            dynamicRowHeight: true
        });
    },

    formatter: function(value, row, column, data, default_formatter) {

        let formatted_value = default_formatter(
            value,
            row,
            column,
            data
        );

        const wrap_fields = [
            "follow_up_1",
            "follow_up_2",
            "follow_up_3",
            "follow_up_4",
            "next_action_to_be_done",
            "outcome"
        ];

        if (wrap_fields.includes(column.fieldname)) {

            if (!value) {
                return "";
            }

            return `
                <div class="daily-follow-up-wrap">
                    ${formatted_value}
                </div>
            `;
        }

        return formatted_value;
    },

    onload: function(report) {

        const style_id = "daily-follow-up-wrap-style";

        if (!document.getElementById(style_id)) {

            const style = document.createElement("style");

            style.id = style_id;

            style.innerHTML = `
                .dt-row {
                    position: relative !important;
                    top: auto !important;
                    height: auto !important;
                }

                .dt-cell {
                    height: auto !important;
                    min-height: 40px;
                }

                .daily-follow-up-wrap {
                    white-space: normal !important;
                    overflow-wrap: anywhere !important;
                    word-break: break-word !important;
                    line-height: 1.5 !important;
                    height: auto !important;
                    min-height: 30px;
                    padding-top: 5px;
                    padding-bottom: 5px;
                    display: block;
                }

                .dt-cell__content {
                    white-space: normal !important;
                    height: auto !important;
                }

                .dt-row .dt-cell {
                    vertical-align: top !important;
                }
            `;

            document.head.appendChild(style);
        }
    }
};