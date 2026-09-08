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

        value = default_formatter(
            value,
            row,
            column,
            data
        );

        // Wrap long text columns
        if (
            column.fieldname === "follow_up_1" ||
            column.fieldname === "follow_up_2" ||
            column.fieldname === "follow_up_3" ||
            column.fieldname === "follow_up_4" ||
            column.fieldname === "next_action_to_be_done" ||
            column.fieldname === "outcome"
        ) {
            return `
                <div style="
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    line-height: 1.5;
                ">
                    ${value || ""}
                </div>
            `;
        }

        return value;
    }
};