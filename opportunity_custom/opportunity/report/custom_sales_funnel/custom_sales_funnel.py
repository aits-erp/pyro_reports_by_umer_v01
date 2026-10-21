
import frappe
from frappe.utils import getdate


def execute(filters=None):
    filters = frappe._dict(filters or {})

    from_date = filters.get("from_date")
    to_date = filters.get("to_date")

    if not from_date or not to_date:
        frappe.throw("Please select From Date and To Date.")

    if getdate(from_date) > getdate(to_date):
        frappe.throw("From Date cannot be after To Date.")

    # ---------------------------------------------------------
    # ACTIVE LEADS
    # ---------------------------------------------------------
    lead_count = frappe.db.sql(
        """
        SELECT COUNT(*)
        FROM `tabLead`
        WHERE DATE(creation) BETWEEN %(from_date)s AND %(to_date)s
          AND docstatus < 2
          AND IFNULL(status, '') NOT IN ('Converted', 'Do Not Contact')
        """,
        {"from_date": from_date, "to_date": to_date}
    )[0][0] or 0

    # ---------------------------------------------------------
    # OPPORTUNITY STATUS COUNTS AND VALUES
    # ---------------------------------------------------------
    opportunities = frappe.db.sql(
        """
        SELECT
            COUNT(*) AS total_opportunities,

            SUM(CASE WHEN status = 'Quotation'
                THEN 1 ELSE 0 END) AS quotation_count,

            SUM(CASE WHEN status = 'Converted'
                THEN 1 ELSE 0 END) AS converted_count,

            SUM(CASE WHEN status = 'Lost'
                THEN 1 ELSE 0 END) AS lost_count,

            SUM(CASE WHEN status = 'Quotation'
                THEN IFNULL(custom_offer_value_rs, 0)
                ELSE 0 END) AS quotation_value,

            SUM(CASE WHEN status = 'Converted'
                THEN IFNULL(custom_offer_value_rs, 0)
                ELSE 0 END) AS converted_value,

            SUM(CASE WHEN status = 'Lost'
                THEN IFNULL(custom_offer_value_rs, 0)
                ELSE 0 END) AS lost_value

        FROM `tabOpportunity`
        WHERE DATE(creation) BETWEEN %(from_date)s AND %(to_date)s
          AND docstatus < 2
        """,
        {"from_date": from_date, "to_date": to_date},
        as_dict=True
    )[0]

    # ---------------------------------------------------------
    # FUNNEL DATA
    # ---------------------------------------------------------
    data = [
        {
            "stage": "Active Leads",
            "count": int(lead_count),
            "offer_value": 0
        },
        {
            "stage": "Opportunities",
            "count": int(opportunities.total_opportunities or 0),
            "offer_value": 0
        },
        {
            "stage": "Quotation",
            "count": int(opportunities.quotation_count or 0),
            "offer_value": float(opportunities.quotation_value or 0)
        },
        {
            "stage": "Converted",
            "count": int(opportunities.converted_count or 0),
            "offer_value": float(opportunities.converted_value or 0)
        },
        {
            "stage": "Lost",
            "count": int(opportunities.lost_count or 0),
            "offer_value": float(opportunities.lost_value or 0)
        }
    ]

    columns = [
        {
            "label": "Funnel Stage",
            "fieldname": "stage",
            "fieldtype": "Data",
            "width": 180
        },
        {
            "label": "Count",
            "fieldname": "count",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": "Offer Value",
            "fieldname": "offer_value",
            "fieldtype": "Currency",
            "width": 180
        }
    ]

    return columns, data

// hii there