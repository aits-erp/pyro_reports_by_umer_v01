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

            return `
                <div style="
                    white-space: normal;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                    line-height: 1.5;
                    padding: 4px 0;
                ">
                    ${formatted_value || ""}
                </div>
            `;
        }

        return formatted_value;
    }
};