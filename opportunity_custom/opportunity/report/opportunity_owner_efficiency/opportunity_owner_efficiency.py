import frappe
from frappe import _

from erpnext.crm.report.campaign_efficiency.campaign_efficiency import (
    get_lead_data,
)


def execute(filters=None):
    filters = filters or {}

    based_on = filters.get("based_on") or "Lead"

    if based_on == "Lead":
        return execute_lead_report(filters)

    return execute_opportunity_report(filters)


# =========================================================
# LEAD OWNER EFFICIENCY
# =========================================================

def execute_lead_report(filters):
    columns = get_lead_columns()

    data = get_lead_data(filters, "Lead Owner")

    # Filter by owner if selected
    if filters.get("owner"):
        data = [
            row
            for row in data
            if row.get("lead_owner") == filters["owner"]
        ]

    # Add full name
    for row in data:
        owner = row.get("lead_owner")

        if owner:
            row["lead_owner_name"] = (
                frappe.db.get_value(
                    "User",
                    owner,
                    "full_name"
                )
                or owner
            )

    return columns, data


def get_lead_columns():
    return [
        {
            "fieldname": "lead_owner_name",
            "label": _("Lead Owner"),
            "fieldtype": "Data",
            "width": 160,
        },
        {
            "fieldname": "lead_owner",
            "label": _("Owner Email"),
            "fieldtype": "Data",
            "width": 220,
        },
        {
            "fieldname": "lead_count",
            "label": _("Lead Count"),
            "fieldtype": "Int",
            "width": 80,
        },
        {
            "fieldname": "opp_count",
            "label": _("Opp Count"),
            "fieldtype": "Int",
            "width": 80,
        },
        {
            "fieldname": "quot_count",
            "label": _("Quot Count"),
            "fieldtype": "Int",
            "width": 80,
        },
        {
            "fieldname": "order_count",
            "label": _("Order Count"),
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "fieldname": "order_value",
            "label": _("Order Value"),
            "fieldtype": "Float",
            "width": 120,
        },
        {
            "fieldname": "opp_lead",
            "label": _("Opp/Lead %"),
            "fieldtype": "Float",
            "width": 100,
        },
        {
            "fieldname": "quot_lead",
            "label": _("Quot/Lead %"),
            "fieldtype": "Float",
            "width": 100,
        },
        {
            "fieldname": "order_quot",
            "label": _("Order/Quot %"),
            "fieldtype": "Float",
            "width": 100,
        },
    ]


# =========================================================
# OPPORTUNITY OWNER EFFICIENCY
# =========================================================

def execute_opportunity_report(filters):
    columns = get_opportunity_columns()
    data = get_opportunity_data(filters)

    return columns, data


def get_opportunity_columns():
    return [
        {
            "fieldname": "opportunity_owner_name",
            "label": _("Opportunity Owner"),
            "fieldtype": "Data",
            "width": 160,
        },
        {
            "fieldname": "opportunity_owner",
            "label": _("Owner Email"),
            "fieldtype": "Data",
            "width": 220,
        },
        {
            "fieldname": "opp_count",
            "label": _("Opp Count"),
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "fieldname": "quot_count",
            "label": _("Quot Count"),
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "fieldname": "order_count",
            "label": _("Order Count"),
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "fieldname": "order_value",
            "label": _("Order Value"),
            "fieldtype": "Currency",
            "width": 130,
        },
        {
            "fieldname": "quot_opp",
            "label": _("Quot/Opp %"),
            "fieldtype": "Percent",
            "width": 110,
        },
        {
            "fieldname": "order_opp",
            "label": _("Order/Opp %"),
            "fieldtype": "Percent",
            "width": 110,
        },
    ]


def get_opportunity_data(filters):
    conditions = []
    values = {}

    # Date filter
    if filters.get("from_date"):
        conditions.append(
            "o.transaction_date >= %(from_date)s"
        )
        values["from_date"] = filters["from_date"]

    if filters.get("to_date"):
        conditions.append(
            "o.transaction_date <= %(to_date)s"
        )
        values["to_date"] = filters["to_date"]

    # Owner filter
    if filters.get("owner"):
        conditions.append(
            "o.opportunity_owner = %(owner)s"
        )
        values["owner"] = filters["owner"]

    condition_sql = ""

    if conditions:
        condition_sql = " AND " + " AND ".join(conditions)

    # Get Opportunities
    opportunities = frappe.db.sql(
        f"""
        SELECT
            o.name,
            o.opportunity_owner
        FROM `tabOpportunity` o
        WHERE
            o.docstatus < 2
            AND IFNULL(o.opportunity_owner, '') != ''
            {condition_sql}
        """,
        values,
        as_dict=True,
    )

    if not opportunities:
        return []

    opportunity_names = [
        d.name
        for d in opportunities
    ]

    quotation_map = get_quotation_data(
        opportunity_names
    )

    sales_order_map = get_sales_order_data(
        opportunity_names
    )

    result = {}

    for opp in opportunities:

        owner = opp.opportunity_owner

        if owner not in result:

            owner_full_name = frappe.db.get_value(
                "User",
                owner,
                "full_name"
            ) or owner

            result[owner] = {
                "opportunity_owner_name": owner_full_name,
                "opportunity_owner": owner,
                "opp_count": 0,
                "quot_count": 0,
                "order_count": 0,
                "order_value": 0,
            }

        # Opportunity Count
        result[owner]["opp_count"] += 1

        # Quotation Count
        if opp.name in quotation_map:
            result[owner]["quot_count"] += (
                quotation_map[opp.name]
            )

        # Sales Order Count + Value
        if opp.name in sales_order_map:

            result[owner]["order_count"] += (
                sales_order_map[opp.name]["count"]
            )

            result[owner]["order_value"] += (
                sales_order_map[opp.name]["value"]
            )

    data = []

    for owner, row in result.items():

        opp_count = row["opp_count"]
        quot_count = row["quot_count"]
        order_count = row["order_count"]

        # Quotation / Opportunity
        row["quot_opp"] = (
            (quot_count / opp_count) * 100
            if opp_count
            else 0
        )

        # Order / Opportunity
        row["order_opp"] = (
            (order_count / opp_count) * 100
            if opp_count
            else 0
        )

        data.append(row)

    data.sort(
        key=lambda x: x.get(
            "order_value",
            0
        ),
        reverse=True,
    )

    return data


# =========================================================
# QUOTATION DATA
# =========================================================

def get_quotation_data(opportunity_names):

    if not opportunity_names:
        return {}

    rows = frappe.db.sql(
        """
        SELECT
            qi.prevdoc_docname AS opportunity,
            COUNT(DISTINCT q.name) AS quotation_count

        FROM `tabQuotation` q

        INNER JOIN `tabQuotation Item` qi
            ON qi.parent = q.name

        WHERE
            q.docstatus = 1
            AND qi.prevdoc_doctype = 'Opportunity'
            AND qi.prevdoc_docname IN %(opportunities)s

        GROUP BY
            qi.prevdoc_docname
        """,
        {
            "opportunities": tuple(
                opportunity_names
            )
        },
        as_dict=True,
    )

    return {
        row.opportunity:
            row.quotation_count
        for row in rows
    }


# =========================================================
# SALES ORDER DATA
# =========================================================

def get_sales_order_data(opportunity_names):

    if not opportunity_names:
        return {}

    # -----------------------------------------------------
    # STEP 1:
    # Find submitted Quotations created from Opportunities
    # -----------------------------------------------------

    quotation_rows = frappe.db.sql(
        """
        SELECT DISTINCT
            q.name AS quotation,
            qi.prevdoc_docname AS opportunity

        FROM `tabQuotation` q

        INNER JOIN `tabQuotation Item` qi
            ON qi.parent = q.name

        WHERE
            q.docstatus = 1
            AND qi.prevdoc_doctype = 'Opportunity'
            AND qi.prevdoc_docname IN %(opportunities)s
        """,
        {
            "opportunities": tuple(
                opportunity_names
            )
        },
        as_dict=True,
    )

    if not quotation_rows:
        return {}

    quotation_to_opportunity = {}

    quotation_names = []

    for row in quotation_rows:

        quotation_names.append(
            row.quotation
        )

        quotation_to_opportunity[
            row.quotation
        ] = row.opportunity

    # -----------------------------------------------------
    # STEP 2:
    # Find submitted Sales Orders created from Quotations
    # -----------------------------------------------------

    sales_orders = frappe.db.sql(
        """
        SELECT
            soi.prevdoc_docname AS quotation,
            so.name AS sales_order,
            so.grand_total AS grand_total

        FROM `tabSales Order` so

        INNER JOIN `tabSales Order Item` soi
            ON soi.parent = so.name

        WHERE
            so.docstatus = 1
            AND soi.prevdoc_docname IN %(quotations)s
        """,
        {
            "quotations": tuple(
                quotation_names
            )
        },
        as_dict=True,
    )

    result = {}

    for row in sales_orders:

        quotation = row.quotation

        if quotation not in quotation_to_opportunity:
            continue

        opportunity = quotation_to_opportunity[
            quotation
        ]

        if opportunity not in result:

            result[opportunity] = {
                "count": 0,
                "value": 0,
            }

        result[opportunity]["count"] += 1

        result[opportunity]["value"] += (
            row.grand_total or 0
        )

    return result