frappe.query_reports["Opportunity Owner Efficiency"] = {
    filters: [
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: erpnext.utils.get_fiscal_year(
                frappe.datetime.get_today(),
                true
            )[1],
            reqd: 1
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: erpnext.utils.get_fiscal_year(
                frappe.datetime.get_today(),
                true
            )[2],
            reqd: 1
        },
        {
            fieldname: "based_on",
            label: __("Efficiency Based On"),
            fieldtype: "Select",
            options: "Lead\nOpportunity",
            default: "Lead",
            reqd: 1
        },
        {
            fieldname: "owner",
            label: __("Owner"),
            fieldtype: "Link",
            options: "User"
        }
    ]
};