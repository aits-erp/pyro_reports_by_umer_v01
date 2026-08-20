import frappe


def execute(filters=None):
    filters = filters or {}

    columns = [
        {
            "label": "Sales Person",
            "fieldname": "sales_person",
            "fieldtype": "Link",
            "options": "Sales Person",
            "width": 120
        },
        {
            "label": "Opportunity",
            "fieldname": "opportunity",
            "fieldtype": "Link",
            "options": "Opportunity",
            "width": 150
        },
        {
            "label": "Customer / Lead Name",
            "fieldname": "customer",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": "Lead Number",
            "fieldname": "lead_number",
            "fieldtype": "Link",
            "options": "Lead",
            "width": 160
        },

        {
            "label": "Follow Up-1 Date",
            "fieldname": "follow_up_1_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": "Follow Up-1",
            "fieldname": "follow_up_1",
            "fieldtype": "Data",
            "width": 250
        },

        {
            "label": "Follow Up-2 Date",
            "fieldname": "follow_up_2_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": "Follow Up-2",
            "fieldname": "follow_up_2",
            "fieldtype": "Data",
            "width": 250
        },

        {
            "label": "Follow Up-3 Date",
            "fieldname": "follow_up_3_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": "Follow Up-3",
            "fieldname": "follow_up_3",
            "fieldtype": "Data",
            "width": 250
        },

        {
            "label": "Follow Up-4 Date",
            "fieldname": "follow_up_4_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": "Follow Up-4",
            "fieldname": "follow_up_4",
            "fieldtype": "Data",
            "width": 250
        },

        {
            "label": "Next Action To Be Done",
            "fieldname": "next_action_to_be_done",
            "fieldtype": "Data",
            "width": 250
        },

        {
            "label": "Outcome",
            "fieldname": "outcome",
            "fieldtype": "Data",
            "width": 200
        }
    ]

    conditions = []
    values = {}

    # ---------------------------------------------------------
    # Sales Person Filter
    # ---------------------------------------------------------

    if filters.get("sales_person"):
        conditions.append(
            """
            opp.custom_sales_person = %(sales_person)s
            """
        )

        values["sales_person"] = filters.get("sales_person")

    # ---------------------------------------------------------
    # Date Range Filter
    # ---------------------------------------------------------

    if filters.get("from_date") and filters.get("to_date"):

        conditions.append(
            """
            (
                opp.custom_date BETWEEN %(from_date)s AND %(to_date)s

                OR

                opp.custom_date_follow_up2 BETWEEN %(from_date)s AND %(to_date)s

                OR

                opp.custom_follow_up_3_date BETWEEN %(from_date)s AND %(to_date)s

                OR

                opp.custom_date_follow_up4 BETWEEN %(from_date)s AND %(to_date)s
            )
            """
        )

        values["from_date"] = filters.get("from_date")
        values["to_date"] = filters.get("to_date")

    # ---------------------------------------------------------
    # WHERE Clause
    # ---------------------------------------------------------

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # ---------------------------------------------------------
    # Main Query
    # ---------------------------------------------------------

    data = frappe.db.sql(
        f"""
        SELECT

            opp.custom_sales_person AS sales_person,

            opp.name AS opportunity,

            CASE
                WHEN opp.opportunity_from = 'Lead'
                    THEN lead.lead_name

                WHEN opp.opportunity_from = 'Customer'
                    THEN opp.party_name

                ELSE opp.party_name
            END AS customer,

            CASE
                WHEN opp.opportunity_from = 'Lead'
                    THEN opp.party_name

                ELSE NULL
            END AS lead_number,

            opp.custom_date AS follow_up_1_date,

            opp.custom_follow_up1 AS follow_up_1,

            opp.custom_date_follow_up2 AS follow_up_2_date,

            opp.custom_follow_up2 AS follow_up_2,

            opp.custom_follow_up_3_date AS follow_up_3_date,

            opp.custom_follow_up_3 AS follow_up_3,

            opp.custom_date_follow_up4 AS follow_up_4_date,

            opp.custom_follow_up4 AS follow_up_4,

            opp.custom_next_action_to_be_done
                AS next_action_to_be_done,

            opp.custom_outcome AS outcome

        FROM `tabOpportunity` opp

        LEFT JOIN `tabLead` lead
            ON opp.opportunity_from = 'Lead'
            AND opp.party_name = lead.name

        {where_clause}

        ORDER BY

            COALESCE(
                opp.custom_date,
                opp.custom_date_follow_up2,
                opp.custom_follow_up_3_date,
                opp.custom_date_follow_up4
            ) ASC,

            opp.name ASC
        """,
        values,
        as_dict=True
    )

    return columns, data