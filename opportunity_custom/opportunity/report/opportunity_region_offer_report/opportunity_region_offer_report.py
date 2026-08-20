import frappe


def execute(filters=None):
    filters = filters or {}

    from_date = filters.get("from_date")
    to_date = filters.get("to_date")
    region = filters.get("region")

    # ---------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------

    if not from_date:
        frappe.throw("Please select From Date.")

    if not to_date:
        frappe.throw("Please select To Date.")

    # ---------------------------------------------------------
    # CONDITIONS
    # ---------------------------------------------------------

    conditions = """
        o.docstatus < 2
        AND DATE(o.creation) BETWEEN %(from_date)s AND %(to_date)s
        AND IFNULL(o.territory, '') != ''
    """

    # Region filter
    if region:
        conditions += """
            AND o.territory = %(region)s
        """

    # ---------------------------------------------------------
    # GET OPPORTUNITY DATA
    # ---------------------------------------------------------

    data = frappe.db.sql(
        f"""
        SELECT
            o.territory AS region,

            /* =================================================
               FIRM
               Maintenance + Project
               ================================================= */

            SUM(
                CASE
                    WHEN o.custom_enquiry_type IN ('Maintenance', 'Project')
                    THEN 1
                    ELSE 0
                END
            ) AS firm_offers,

            /* =================================================
               FIRM VALUE IN LACS
               ================================================= */

            SUM(
                CASE
                    WHEN o.custom_enquriry_type IN ('Maintenance', 'Project')
                    THEN IFNULL(o.custom_offer_value_rs, 0)
                    ELSE 0
                END
            ) / 100000 AS firm_value_lacs,

            /* =================================================
               BIDDING
               Budget
               ================================================= */

            SUM(
                CASE
                    WHEN o.custom_enquriry_type = 'Budget'
                    THEN 1
                    ELSE 0
                END
            ) AS bidding_offers,

            /* =================================================
               BIDDING VALUE
               ================================================= */

            SUM(
                CASE
                    WHEN o.custom_enquriry_type = 'Budget'
                    THEN IFNULL(o.custom_offer_value_rs, 0)
                    ELSE 0
                END
            ) AS bidding_value_rs

        FROM `tabOpportunity` o

        WHERE {conditions}

        GROUP BY o.territory

        ORDER BY o.territory
        """,
        {
            "from_date": from_date,
            "to_date": to_date,
            "region": region
        },
        as_dict=True
    )

    # ---------------------------------------------------------
    # TOTAL VARIABLES
    # ---------------------------------------------------------

    total_firm_offers = 0
    total_firm_value_lacs = 0
    total_bidding_offers = 0
    total_bidding_value_rs = 0

    # ---------------------------------------------------------
    # PROCESS DATA
    # ---------------------------------------------------------

    for row in data:

        row["firm_offers"] = int(
            row.get("firm_offers") or 0
        )

        row["firm_value_lacs"] = float(
            row.get("firm_value_lacs") or 0
        )

        row["bidding_offers"] = int(
            row.get("bidding_offers") or 0
        )

        row["bidding_value_rs"] = float(
            row.get("bidding_value_rs") or 0
        )

        # Add to totals
        total_firm_offers += row["firm_offers"]
        total_firm_value_lacs += row["firm_value_lacs"]

        total_bidding_offers += row["bidding_offers"]
        total_bidding_value_rs += row["bidding_value_rs"]

    # ---------------------------------------------------------
    # TOTAL ROW
    # ---------------------------------------------------------

    data.append({
        "region": "Total",
        "firm_offers": total_firm_offers,
        "firm_value_lacs": total_firm_value_lacs,
        "bidding_offers": total_bidding_offers,
        "bidding_value_rs": total_bidding_value_rs
    })

    # ---------------------------------------------------------
    # REPORT COLUMNS
    # ---------------------------------------------------------

    columns = [

        {
            "label": "Region",
            "fieldname": "region",
            "fieldtype": "Data",
            "width": 150
        },

        {
            "label": "No of Offers",
            "fieldname": "firm_offers",
            "fieldtype": "Int",
            "width": 110
        },

        {
            "label": "Value in Lacs",
            "fieldname": "firm_value_lacs",
            "fieldtype": "Float",
            "precision": 2,
            "width": 130
        },

        {
            "label": "No of Offers",
            "fieldname": "bidding_offers",
            "fieldtype": "Int",
            "width": 110
        },

        {
            "label": "Value of Offers in Rs",
            "fieldname": "bidding_value_rs",
            "fieldtype": "Currency",
            "width": 160
        }
    ]

    return columns, data