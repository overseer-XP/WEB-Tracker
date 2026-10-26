"""Build the tracker feature map workbook.

Usage: python3 -I docs/feature_map/build_feature_map.py <out.xlsx> [<screenshots dir>]

Screenshots come from take_screens.js (shots.json + S01.png ...). Without them the workbook has no Pictures sheet.

Edit the tables below when the tracker changes, then run it again.
Every feature, rule and field has an ID (F.., R.., D..) so the sheets can point at each other.
"""
import json
import os
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.hyperlink import Hyperlink

OUT = sys.argv[1]
SHOTS_DIR = sys.argv[2] if len(sys.argv) > 2 else None
SHOTS = json.load(open(os.path.join(SHOTS_DIR, "shots.json"))) if SHOTS_DIR else []
VERSION = "Tracker version 13 (14 Oct 2026)"

# --------------------------------------------------------------------------- 1. Features
# ID, Area, Feature, What it does, Where to find it, Who uses it, Rules used, Data used, Simple view
FEATURES = [
    ("F01", "Navigation", "Left menu", "Links to My tasks, Overview, SOW tracker, Platform access, Best Practices and Settings (Settings only for editors). My tasks shows how many open items you have.", "Left side of every screen", "Everyone", "R14", "D01, D09", "Same"),
    ("F02", "Navigation", "Brand list in the menu", "Every brand grouped by stage, latest stage first (Live, SOW, Best Practices, Founder Workshops, Setup, Qualification, then On Hold and Internal). Each brand has a health dot and its open task count. Paused brands carry a Paused tag.", "Left menu, under the links", "Everyone", "R10, R11", "D01, D02", "Same"),
    ("F03", "Navigation", "Add brand", "Creates a brand with a name and stage. Also creates its empty SOW row and its onboarding step checklist (53 steps).", "Bottom of the left menu", "Editors", "", "D01, D03, D07", "Same"),
    ("F04", "Navigation", "Simple / Full switch and Leadership view", "Simple hides detail people rarely need; Full shows every column and field. Members start in Simple, editors in Full, and each person's choice is remembered. Leadership view is a role: leads tick Leadership for a person in Settings > People, and only those people see the Leadership view button (Overview with exceptions first and the brands table folded).", "Top bar; Settings > People", "Everyone; leadership", "", "D08, D10", "Is the switch"),
    ("F05", "Navigation", "You are (name picker)", "Each person picks their name once. The tracker remembers it for that person and uses it to build My tasks. It tries to guess from the claude.ai account name first.", "Top bar", "Everyone", "R15", "D08, D10", "Same"),
    ("F06", "Navigation", "Role tag", "Shows Lead / admin, Member or View only, so people know what they can change.", "Top bar", "Everyone", "R18", "", "Same"),
    ("F10", "My tasks", "My tasks page", "Your open tasks and steps in three tabs: Brand onboarding, Onboarded brands, All my work. List or Board layout. Group by brand, priority, due date, status, team or nothing; sort by most urgent, due date, priority or brand; filter by vertical; fold groups. Mentions and Since your last visit at the top. Choices are remembered per person.", "My tasks", "Team members", "R01, R02", "D02, D07", "Hides role and priority on items"),
    ("F11", "My tasks", "One-click status change", "Change a task or step status straight from the list. No form.", "Status pill on every row", "Everyone who can edit", "R16, R17", "D02, D07", "Same"),
    ("F12", "My tasks", "Blocker shown in red", "A blocked item shows the reason and who it is waiting on, in red under the title.", "My tasks, brand task list", "Everyone", "R16", "D02", "Same"),
    ("F20", "Overview", "Summary tiles", "Five numbers: active brands, brands blocked, brands at risk, tasks late, SOWs to sign this week. Red or amber when not zero. Brands on hold are left out.", "Top of Overview", "Leadership, leads", "R01, R10", "D01, D02, D03", "Same"),
    ("F23", "Overview", "Pipeline", "One column per brand stage from Qualification to Live, plus On hold, with the count and every brand in it with its health dot. Click a brand to open it.", "Overview", "Leadership, everyone", "R19", "D01", "Same"),
    ("F21", "Overview", "SOW signing plan", "Every unsigned SOW placed in the week of its target sign date: This week, Next week, Week of ..., No date yet. Blocked SOWs keep their date and show a red Blocked tag. Brands on hold sit in their own On hold column.", "Overview, under the tiles", "Leadership, SOW owners", "R04, R13", "D03", "Same"),
    ("F22", "Overview", "All brands table", "One row per brand: stage, health, next step and lead. Full view adds open, blocked and late counts, platform access, SOW stage, target sign, BP progress and onboarding %.", "Overview, bottom", "Leadership, leads", "R01, R05, R06, R07, R08, R09, R10", "D01-D07", "5 columns only"),
    ("F30", "Brand page", "Brand header", "Health with a one-line summary (open, blocked, late, onboarding %), facts strip (stage, brand lead, founder, sprint) and the next step on one line. Empty facts show an Add button for editors.", "Brand page", "Everyone", "R19, R20", "D01, D02", "Same"),
    ("F83", "Brand page", "Section tiles", "Six tiles replace the thin tabs: Campaigns (or Tasks), Onboarding, Platform access, SOW, Best Practices, Updates. Each shows its key number and a coloured edge (red blocked or overdue, amber waiting, green done, blue in progress). Inside a campaign or team the header and tiles shrink to a slim pinned bar: brand, health, the path (Campaigns > campaign > team) and small section tabs.", "Brand page", "Everyone", "R20, R22, R23", "D01-D07, D13, D14", "Same"),
    ("F84", "Brand page", "Campaigns view", "Tasks open on campaign cards: name, what it is for, dates and days left, one progress bar and one warning line (blocked, late, open dependencies). Brand-wide blockers sit in one strip above the cards. Brand-wide work sits in Not in a campaign. By team keeps the team cards.", "Brand > Campaigns", "Everyone", "R25", "D02, D14", "Same"),
    ("F85", "Brand page", "Campaign page", "One campaign: name, status, dates, owner, what it is for, one progress line and one warning line, then its board, then the timeline. No separate team step and no dependency box.", "Brand > Campaigns > a campaign", "Everyone", "R25", "D02, D14", "Same"),
    ("F86", "Brand page", "Campaign board (Trello lists)", "Lists side by side, one per team by default (Brand, Creative and so on). Anyone who can edit can add a list with any name (optionally linked to a team), rename a list by clicking its name, delete an empty list, add a card at the bottom of a list, and drag cards between lists. Moving a card into a team list moves it to that team. Card front shows its status as a tag, plus due date, priority, checklist, comments, links and people. Filters: person, due; Show done cards. Brands with no campaigns get one board for all their work.", "Brand > Campaigns > a campaign", "Everyone", "R26", "D02, D14", "Same"),
    ("F87", "Brand page", "Card back", "The task panel adds a checklist (items with who and due, tick to complete, progress bar) and a comment thread with @mentions. Every status move is written to the thread as activity. Anyone who can edit can comment; status and fields follow the task rules.", "Click a card", "Everyone", "R15, R26", "D02, D13", "Same"),
    ("F88", "Leadership", "Leadership page", "A page in the left menu for people with the Leadership tick (Settings > People), replacing the old Leadership view button. Leaders land on it. Weekly brief: active, blocked, at risk, late, decisions waiting, launches in 2 weeks, with change since the review before. Review day set on the page (default Monday).", "Leadership", "Leadership", "R27", "D01, D02, D12, D15", "Same"),
    ("F89", "Leadership", "Top exceptions", "Up to 5 red or amber brands, each with cause, owner (brand lead), next step and the ask of leadership. Open goes to the right section; Ask the lead posts a question that reaches them by @mention.", "Leadership", "Leadership", "R21, R27", "D01, D13", "Same"),
    ("F90", "Leadership", "Decisions inbox", "Escalations from the team plus gate steps whose earlier steps are all done. Agree or Send back with a note; gates are signed off (Done with the leader named) or sent back (the step shows why until it is changed). Every decision is posted on the brand Updates with an @mention, and kept under Recently decided.", "Leadership", "Leadership", "R17, R27", "D07, D13, D15", "Same"),
    ("F91", "Everyone", "Needs leadership button", "On any task, step, platform access row or SOW panel: say what is needed and by when. The item then shows With leadership, also on the board card.", "Any edit panel", "Members, leads", "R27", "D15", "Same"),
    ("F92", "Leadership", "Launch calendar", "Campaign launch or end dates for the next six weeks by week, plus a Late column, with blocked tasks and open dependencies per campaign. Campaigns with no date are listed so they get one. A card opens the campaign.", "Leadership", "Leadership", "R25", "D14", "Same"),
    ("F93", "Brand page", "Brand home", "A brand opens on one page of tiles sized by importance: about the brand (stage, one-line intro, founder, brand lead), health (shape plus word, the reasons, next step), campaigns on one shared calendar, SOW percent with a bar, the onboarding journey as one segmented bar, then platform access, Best Practices and updates. Every tile opens its section.", "Brand", "Everyone", "R28", "D01, D14", "Same"),
    ("F94", "Brand page", "SOW page", "Big SOW percent and bar, the SOW stage and facts, then every SOW board square for this brand grouped in lanes. Percent counts Done as 1 and In progress as half; N/A is left out.", "Brand > SOW", "Leads, leadership", "R28", "D04", "Same"),
    ("F95", "Brand page", "Phase track", "Onboarding phases as a horizontal track (vertical on phones): done phases ticked, the current phase ringed. Click a phase to see its steps underneath.", "Brand > Onboarding", "Everyone", "R04", "D03", "Same"),
    ("F96", "Brand page", "Campaign rows", "Campaigns page: shared calendar on top, then one row per campaign with a status shape and word, what it is for, dates, and a progress ring. No coloured edges.", "Brand > Campaigns", "Everyone", "R28", "D14", "Same"),
    ("F97", "Board", "Members on a card", "Tag or remove members on the card back from a list of active people. Saves straight away and logs Added or Removed on the card.", "Card back", "Everyone who can move the card", "R26", "D02", "Same"),
    ("F31", "Brand page", "Team cards", "The Tasks tab opens on one card per team (Brand, Creative, Performance, Creator Partnerships, Website SEO and CRM, Finance, Other). Each card: open count, blocked and late tags, progress bar, the 3 most urgent tasks.", "Brand > Tasks", "Leads, leadership", "R01, R12", "D02, D09", "Same"),
    ("F32", "Brand page", "Team task list", "Click a card to see only that team's tasks, most urgent first. Chips switch team in one click. Open / All toggle shows completed tasks.", "Brand > Tasks > a team", "Team members, leads", "R01, R12", "D02", "Hides support, priority, start, links"),
    ("F33", "Brand page", "Add task", "Name, team, owner, deadline, priority. Inside a team the team is filled in.", "Brand > Tasks", "Anyone who can edit", "", "D02", "Same"),
    ("F34", "Brand page", "Task editor", "Side panel with every field of a task, including team, blocker and links. Editors can delete.", "Click a task", "Owner, support, editors", "R16, R18", "D02", "Fewer fields"),
    ("F35", "Brand page", "Onboarding steps", "The team's 53-step checklist in 7 phases (P1 Qualification to P7 SOW Signed). Opens on the current phase; others are folded. Each step: code, name, gate or optional tag, document label, owner, due date, status.", "Brand > Onboarding steps", "Leads, step owners", "R09, R11, R17", "D06, D07", "Hides completed phases"),
    ("F36", "Brand page", "Gate rule", "A gate step (P1.04 LOI signed, P5.04 Best Practices QA review, P6.01 SOW draft 1 review, P6.06 Send SOW for signature) cannot be Done while an earlier required step is open. The tracker says which steps are missing.", "Onboarding steps, My tasks, Excel import", "Everyone", "R17", "D06, D07", "Same"),
    ("F37", "Brand page", "Mark phase done", "Sets every step in a phase to Done in one go, only if earlier phases are finished.", "Top of each open phase", "Editors", "R17", "D07", "Same"),
    ("F38", "Brand page", "Step editor", "Status, owner, deadline, document link, blocker and notes for one step on one brand.", "Edit on any step", "Anyone who can edit", "R16, R17", "D07", "Same"),
    ("F39", "Brand page", "Brand platform access tab", "That brand's platform rows in the Full layout: 5-step status, team, who has a login, next step, chase flag. Message for founder button.", "Brand > Platform access", "Paid team", "R03, R05, R22", "D04", "Fewer columns"),
    ("F40", "Brand page", "Brand SOW tab", "SOW stage strip, stage picker, owner, target sign, draft due, batch, SOW and Growth Forecast links, GF status, blocker and next step. Internal brands show no SOW.", "Brand > SOW", "SOW owners, leadership", "R04, R13", "D03", "Hides support and start"),
    ("F41", "Brand page", "Brand Best Practices tab", "Status of each BP section with a picker, overall result, owner, blocker, notes.", "Brand > Best Practices", "BP owners", "R06, R07", "D05", "Hides notes"),
    ("F42", "Brand page", "Brand details editor", "Name, stage, lead, founder, website, sprint, next step, paused, restricted.", "Edit details", "Editors", "", "D01", "Same"),
    ("F07", "Navigation", "Search", "Search box in the top bar finds brands, tasks, people and steps as you type. Enter opens the first result. Press / to jump to it.", "Top bar", "Everyone", "", "D01, D02", "Same"),
    ("F24", "Overview", "Needs attention", "The exceptions to act on: brands Blocked (SOW, access, BPs, a gate step or a High or Urgent task), SOW past its target, stage mismatch (Live but SOW not signed, or the reverse), and no change for 7 days. Each row opens the brand on the right tab. Below it, Missing information counts tasks with no deadline or owner, brands with no lead and SOWs with no owner.", "Overview", "Leadership, leads", "R20, R21", "D01, D02, D03", "Leadership sees the top 12"),
    ("F25", "Overview", "Trends on tiles", "One snapshot of the tiles is saved each day the Overview is opened. Tiles then show the change against about a week ago.", "Overview tiles", "Leadership", "", "D12", "Same"),
    ("F26", "Overview", "Sortable brands table", "Click any column title to sort, click again to reverse. Updated shows when anything on the brand last changed; red after 7 days. Leadership sees the table folded behind a button.", "Overview", "Leads, leadership", "", "D01", "Fewer columns"),
    ("F27", "People", "People and capacity", "Open tasks owned per person with a bar to compare, blocked, late, due in 7 days, no date, tasks they support and brands. Filter by team or vertical. Click a person to list their tasks; No owner lists tasks nobody owns.", "People", "Leads, leadership", "", "D02", "Same"),
    ("F43", "Brand page", "Updates tab", "Comments on the brand (with @name mentions) next to the last 15 changes from the change log.", "Brand > Updates", "Everyone", "", "D02, D13", "Same"),
    ("F44", "Brand page", "Client view", "A clean status page for one brand: % done, stage, SOW date, progress by stage and the access still needed. No tasks, notes, people or other brands. Download it as a file to send. Leads only.", "Brand > Client view", "Clients (via leads)", "", "D01, D03, D04, D07", "Same"),
    ("F45", "Brand page", "Days in stage and Updated", "Brand header shows when anything last changed, and the Stage fact shows days in stage once a stage change is recorded. Header also lists what blocks the brand.", "Brand page", "Leads", "", "D01", "Same"),
    ("F67", "Settings", "Task templates", "Named sets of tasks (name, team, days until due) per vertical. Add from template on a brand's Tasks tab creates them in one go.", "Settings > Task templates; Brand > Tasks", "Leads", "", "D09", "n/a"),
    ("F50", "SOW tracker", "SOW tracker page", "List view (Sign dates and blockers). One row per brand sorted by target sign date. Stage, owner, target sign with due flag, documents, blocker, next step. Blocked SOWs show a red Blocked tag next to the date.", "SOW tracker", "Leadership, SOW owners", "R04, R13", "D03", "Hides draft due and batch"),
    ("F54", "SOW tracker", "SOW progress board", "Default SOW view, built from Cat's sheet. One row per brand, columns grouped Onboarding and access, Workshops, Strategy and preparation, SOW components, Workshops and sign-off. Each square rolls up one or more onboarding steps (Done, In progress, Not done). Click a square to change those steps. Columns live in config/sow_board, not in code.", "SOW tracker > Progress board", "Leadership, SOW owners, everyone", "R09, R17", "D03, D06, D07", "Hides blocker column"),
    ("F55", "Platform access", "Platform access grid", "Default access view. Brands down, platforms across, one square per brand and platform with its status. Click to edit, + to add a platform for a brand. Filter to brands missing access.", "Platform access > By brand", "Paid team, leads", "R03, R05", "D04", "Same"),
    ("F51", "Platform access", "Platform access page (Full)", "Brand list on the left (find box, granted out of total, chase and founder counts, brands to chase first). The picked brand shows on the right: platform, team, status, access type, how given, team logins, next step, last chased, comments. Queues filter both. Built for 40 to 100 brands. Status only, never passwords.", "Platform access with Full on", "Paid team, Noopur, BP team", "R03, R05, R22, R23, R24", "D04, D13", "Grid instead"),
    ("F52", "Best Practices", "BP grid", "One row per brand: progress bar, overall status, then one dot per section, grouped (Brand and content, Website and retention, Paid, Partnerships, Data). Click a dot to pick its status from a short menu. Filter All, Not complete, Blocked; sort by needs work, name or due date. 17 sections: the 16 from the team's BP sheet plus UGC. Sections and groups are data (Settings > Lists, config/bp_groups).", "Best Practices", "BP owners, leads", "R07, R08", "D05, D09", "Hides owner and due"),
    ("F53", "Best Practices", "Start tracking a brand", "Adds a brand to the BP grid with every section Not Started.", "Best Practices, top", "Anyone who can edit", "", "D05", "Same"),
    ("F60", "Settings", "People", "Add people, mark them team, external, group or unconfirmed, add other spellings (for example Noops for Noopur), switch people off.", "Settings > People", "Editors", "R15", "D08", "n/a"),
    ("F61", "Settings", "Lists", "Every dropdown: task status, priority, stage, platforms, access level and status, SOW stage, step status, BP sections and status, teams.", "Settings > Lists", "Editors", "", "D09", "n/a"),
    ("F62", "Settings", "Step list", "Rename steps, mark gates and optional steps, set default owner and document label. Codes never change, so progress is kept.", "Settings > Step list", "Editors", "R17", "D06", "n/a"),
    ("F63", "Settings", "Needs a brand", "Old completed tasks with no brand. Pick a brand for each.", "Settings > Needs a brand", "Editors", "", "D02", "n/a"),
    ("F64", "Settings", "Change log", "Every edit made in the tracker: when, who, what, old value, new value.", "Settings > Change log", "Editors", "", "D11", "n/a"),
    ("F65", "Settings", "Excel export", "Downloads a workbook with the same sheets as the old COE tracker: Brand Tracker, one tab per brand, Platform Access, SOW Tracker, BP Tracker, Onboarding Steps, Completed Archive, Lists.", "Settings > Export and backup", "Editors, leadership", "R01-R10", "All", "n/a"),
    ("F66", "Settings", "Full backup", "Downloads every record as one JSON file.", "Settings > Export and backup", "Admin", "", "All", "n/a"),
    ("F70", "Excel round trip", "Editable Excel copy", "Claude exports the live tracker to Excel with dropdowns and due flag formulas. People edit white cells, add tasks at the bottom, and send it back.", "Ask Claude", "Anyone who prefers Excel", "R01, R03, R04, R17", "D01-D07", "n/a"),
    ("F71", "Excel round trip", "Excel import", "Only changed cells are written. If the same field was changed in the tracker after the export, the tracker keeps its value and the cell is listed. Bad values, text dates, blocked without a reason and gate steps done too early are skipped and listed.", "Ask Claude", "Product owner", "R16, R17", "D01-D07", "n/a"),
    ("F80", "Safety", "Access rules", "Anyone the page is shared with can read. Only people with edit or interact access can write. Only editors can change lists, people and the step list. The database enforces this, not just the screen.", "Share menu of the page", "Admin", "R18", "All", "n/a"),
    ("F81", "Safety", "Blocker needs a reason", "Marking anything Blocked asks for one line and a person. No silent blocks.", "Any status change to Blocked", "Everyone", "R16", "D02, D03, D04, D07", "Same"),
    ("F82", "Safety", "No overwriting other people", "Each edit is saved field by field. Two people editing different fields of the same task do not undo each other.", "Everywhere", "Everyone", "", "All", "Same"),
]

# --------------------------------------------------------------------------- 2. Who it helps
# Group, Question they ask, Where the tracker answers it, Features
AUDIENCE = [
    ("Leadership (Ben, founders of Valerie)", "Which brands are in trouble right now?", "Overview tiles and health column; red dots in the left menu", "F20, F22, F02"),
    ("Leadership (Ben, founders of Valerie)", "Which SOWs sign this week and next?", "Overview > SOW signing plan", "F21"),
    ("Leadership (Ben, founders of Valerie)", "Where is brand X in onboarding?", "Brand header (onboarding %), Onboarding steps tab", "F30, F35"),
    ("Leadership (Ben, founders of Valerie)", "What is a brand waiting on?", "Blocked tags on team cards, blocker lines in red", "F31, F12"),
    ("Leadership (Ben, founders of Valerie)", "Can I see it in Excel for a meeting?", "Excel export", "F65"),
    ("Product owner / admin", "Who changed what?", "Change log", "F64"),
    ("Product owner / admin", "How do I change a step, list or person without a rebuild?", "Settings", "F60, F61, F62"),
    ("Product owner / admin", "Can people break the setup?", "Access rules: only editors change lists, people and steps", "F80"),
    ("Brand leads / pod leads", "What is late or blocked on my brand, by team?", "Team cards", "F31"),
    ("Brand leads / pod leads", "What is the next onboarding step and is a gate holding us?", "Onboarding steps with gates", "F35, F36"),
    ("Brand leads / pod leads", "Update a whole phase quickly", "Mark phase done", "F37"),
    ("Team leads (Creative, Performance, Creator, Website/CRM, Finance)", "What does my team owe across a brand?", "Team task list", "F32"),
    ("Team members", "What do I need to do today?", "My tasks: blocked, late, due soon first", "F10"),
    ("Team members", "How do I update fast?", "One-click status; blocker asks one line", "F11, F81"),
    ("Team members", "I prefer Excel", "Editable Excel copy and import", "F70, F71"),
    ("Paid team", "Which platform access is still missing and for how long?", "Platform access page, days waiting", "F51, F39"),
    ("SOW owners", "What stage is my SOW in and what is next?", "SOW tracker and brand SOW tab", "F50, F40"),
    ("BP owners / vertical leads", "Which BP sections are done, in QA or blocked?", "BP grid", "F52, F41"),
    ("Finance (Marcus)", "Which finance tasks and workshops are open?", "Finance team card on each brand", "F31, F32"),
    ("Viewers", "See progress without changing anything", "View only access, everything readable", "F80"),
]

# --------------------------------------------------------------------------- 3. Rules
# ID, Rule, How it works, Where it shows, Source
RULES = [
    ("R01", "Task due flag", "Blank if the task is Complete or has no date. Overdue if the deadline is before today. Due Soon if it is today or within 3 days. Otherwise On Time. Shown as 'Late by 3 days', 'Due today', 'Due tomorrow' or 'Due Fri 16 Oct'.", "F10, F20, F22, F31, F32, F65, F70", "COE Excel formula"),
    ("R02", "My tasks grouping", "Blocked first, then Late, then Due in 3 days, then everything else. Inside each group, earliest date first.", "F10", "Brief section 7"),
    ("R03", "Platform access due flag and days waiting", "Due flag works like R01 but is blank when Granted or Not Needed. Days waiting = today minus requested date, blank when Granted or Not Needed.", "F39, F51", "COE Excel formula"),
    ("R04", "SOW due flag", "Blank when Signed. Uses Target sign date; if empty, uses Draft due. Same thresholds as R01.", "F21, F40, F50", "COE Excel formula"),
    ("R05", "Platform access summary", "Not Set Up if no rows except Not Needed. Blocked if any row is Blocked. All Granted if every counted row is Granted. Otherwise In Progress. Also shows 'granted / counted'.", "F22, F39", "COE Excel formula"),
    ("R06", "BP progress", "Complete sections divided by (sections minus N/A).", "F22, F41, F52", "COE Excel formula"),
    ("R07", "BP overall", "Blocked if any section is Blocked. Complete if every counted section is Complete. Not Started if all are Not Started. In QA if any is In QA. Otherwise In Progress.", "F22, F41, F52", "COE Excel formula"),
    ("R08", "Open, blocked and late counts", "Open = tasks with a name that are not Complete. Blocked = status Blocked. Late = due flag Overdue.", "F02, F20, F22, F30, F31", "COE Excel formula"),
    ("R09", "Onboarding %", "Steps Done divided by (53 minus steps marked N/A). Optional steps count.", "F22, F30, F35", "COE Excel formula"),
    ("R10", "Brand health", "On Hold first: if the brand is on hold (R19) health is On Hold (empty grey ring). Otherwise Blocked if any blocked task, any blocked platform, SOW stage Blocked or BP overall Blocked. At Risk if any late task. Live if SOW is Signed. Otherwise On Track. Shown as a dot (square red for Blocked) plus the word.", "F02, F20, F22, F30", "COE Excel formula"),
    ("R11", "Current phase", "The first phase that still has a required step not Done or N/A. Optional steps never hold a phase open.", "F35", "Brief section 6"),
    ("R12", "Team of a task", "Each task has one team. Tasks with no team or an old team name show under Other. New tasks get the team you are looking at. Existing tasks were sorted by keyword and can be moved in one click.", "F31, F32, F70", "Product owner, 8 Oct"),
    ("R13", "SOW signing week", "Target sign date placed in its Monday-to-Sunday week. Signed SOWs and internal brands are left out.", "F21", "Product owner, 8 Oct"),
    ("R14", "My tasks count", "Number of open tasks and steps that match you (R15).", "F01", "Built for this tracker"),
    ("R15", "Matching you to work", "A task is yours if its owner or any support name equals your name or one of your other spellings in Settings > People. A step is yours if its owner matches.", "F05, F10, F60", "Built for this tracker"),
    ("R16", "Blocked needs a reason", "Setting Blocked asks for one line and a person. Leaving Blocked clears the blocker.", "F11, F12, F34, F38, F71, F81", "Brief section 7"),
    ("R17", "Gate rule", "A gate step cannot be Done while any earlier step that is not optional is still open (not Done or N/A).", "F35, F36, F37, F38, F71", "Brief section 6"),
    ("R19", "On hold", "A brand is on hold when its stage is On Hold or it is marked paused. Then: health says On Hold; it leaves the active brands, blocked, at risk, tasks late and SOWs to sign tiles; the SOW signing plan shows it in an On hold column; the SOW tracker tags it and lists it last; the brand page shows a notice; My tasks puts its work in a 'Brands on hold' group. Its SOW stage is kept as it was, so nothing is lost when it comes back.", "F10, F20, F21, F22, F30, F50", "Product owner, 13 Oct"),
    ("R20", "Two levels of blocked", "Blocked (red square dot) only when the SOW, platform access, Best Practices, a gate step or a High or Urgent task is blocked. Any other blocked task makes the brand Has blockers (red ring), shown after At Risk.", "F20, F22, F24, F30", "Review 14 Oct"),
    ("R21", "Needs attention", "Listed when: Blocked; SOW target passed and not Signed; brand Live but SOW not Signed, or SOW Signed but brand not Live; nothing changed on the brand for 7 days. Brands on hold and internal brands are left out.", "F24", "Review 14 Oct"),
    ("R22", "Founder chase", "A platform row at Asked founder for 2 working days or more since the last ask or chase is flagged Chase founder on the grid, in the queue and in Needs attention. Days set in Settings > Access setup.", "F24, F39, F51", "Product owner, 19 Oct"),
    ("R23", "BP waits for access", "Each BP section maps to the platforms it audits (Settings > Access setup). A section shows Locked until every mapped platform for that brand is Granted or Team confirmed, then Ready.", "F51, F52, F53", "Product owner, 19 Oct"),
    ("R24", "One Simple / Full switch", "Only the top bar has a Simple / Full switch. Pages never add their own. Simple shows the short version of each page (the access grid), Full shows everything (the brand list with details). tests/audit.js and tests/controls.js fail if a page adds a second switch.", "F04, F51, F55", "Product owner, 19 Oct"),
    ("R25", "Campaign dependencies", "A campaign lists what the team writes down plus its own blocked tasks. Brand-wide blockers (platform access with the founder or blocked, an unsigned SOW) show once, on the Campaigns page. Cleared items fold away and stay on record.", "F84, F85", "Product owner, 23 Oct"),
    ("R26", "Moving a card", "Dragging a card between lists changes its list (and its team when the list is linked to one), not its status. Status is changed on the card back; Blocked asks for a reason and a person. Only the owner, support team or a lead can move a card, and every move is logged on the card.", "F86, F87", "Product owner, 26 Oct"),
    ("R27", "Leadership access", "Only people with the Leadership tick see the Leadership page and its menu count. Anyone who can edit can send an item to leadership. The tracker cannot stop someone without the tick from writing a decision through the database; that limit comes with the full build.", "F88-F92", "Product owner, 26 Oct"),
    ("R28", "Colour means status only", "Five meanings: green finished or healthy, blue moving, amber needs a look, red stopped, grey not started or parked. Each always comes with a word and a shape (circle tick, clock, triangle, square cross, ring). Teams are named, not coloured. No coloured edges on cards.", "F93, F96", "WCAG 1.4.1; NHS status palette"),
    ("R18", "Who can do what", "View only: read. Member: change status of own tasks (screen rule) and any step. Lead / admin: everything, including Settings, delete, add brand. Database: only editors write lists, people, steps.", "F06, F34, F80", "Brief section 8"),
]

# --------------------------------------------------------------------------- 5. Data fields
# ID, Record, Field, Meaning, Filled by, Used by (features), Used by (rules)
FIELDS = [
    ("D01", "Brand", "name, founder, website, stage, lead, sprint, next step, paused, restricted, order", "One record per brand", "Editors", "F02, F03, F22, F30, F42, F65, F70", "R10"),
    ("D02", "Task", "brand, team, title, owner, support, status, priority, start, deadline, notes, brief link, creative link, blocker", "One record per task", "Anyone who can edit; Excel import", "F10, F11, F12, F20, F22, F31-F34, F63, F65, F70", "R01, R02, R08, R10, R12, R15, R16"),
    ("D03", "SOW", "stage, owner, support, start, draft due, target sign, blocker, next step, SOW link, Growth Forecast link, GF updated, GF status, batch", "One record per brand (not internal)", "SOW owners", "F20, F21, F22, F40, F50, F65, F70", "R04, R10, R13"),
    ("D04", "Platform access", "brand, platform, level, needed for, team, how given, owner, brand contact, asked on, deadline, status (Needed, Asked founder, Founder actioned, Granted, Team confirmed), team logins, next step (what, who, by when), chase log, blocker, notes", "One record per brand and platform", "Paid team", "F39, F51, F65, F70", "R03, R05, R10"),
    ("D05", "Best Practices", "owner, due date, status per section, blocker, doc link, notes", "One record per tracked brand", "BP owners", "F41, F52, F53, F65, F70", "R06, R07, R10"),
    ("D06", "Step list", "code, phase, order, name, gate, optional, default owner, document label", "53 records, same for every brand", "Editors in Settings", "F35, F36, F62", "R09, R11, R17"),
    ("D07", "Brand steps", "for each step code: status, owner, deadline, link, blocker, notes", "One record per brand", "Leads, step owners; Excel import", "F10, F35-F38, F65, F70", "R09, R11, R15, R17"),
    ("D08", "People", "name, type (team, external, group, unconfirmed), other spellings, active", "One list", "Editors", "F05, F10, F60, all owner pickers", "R15"),
    ("D09", "Lists", "task status, priority, stage, platform, access level and status, SOW stage, step status, BP sections and status, teams", "One record", "Editors", "Every dropdown, F31, F52", "R07, R12"),
    ("D10", "Who you are", "the person you picked", "One private record per viewer", "Each viewer", "F05, F10", "R15"),
    ("D11", "Change log", "time, person, what, field, old, new", "One record per person per day", "Written by the tracker", "F64", ""),
    ("D12", "Daily snapshot", "date, active, blocked, at risk, late, SOWs this week, signed, live", "One record per day", "Written when the Overview opens", "F25", ""),
    ("D13", "Comments", "brand, text, by, time, mentions", "One record per comment", "Anyone who can edit", "F43, F10", ""),
    ("D14", "Campaigns", "brand, name, status, owner, start, launch or end, what it is for, success looks like, link, dependencies (text, kind, who, needed by, open or cleared). Tasks carry a campaign id.", "One record per campaign", "Anyone who can edit", "F83, F84, F85", "R25"),
    ("D15", "Escalations", "brand, kind (task, step, access, SOW, gate), item, what is needed, needed by, raised by and when, state (Open, Agreed, Sent back), decision note, decided by and when", "One record per escalation or gate decision", "Anyone who can edit raises; leaders decide", "F90, F91", "R27"),
]

# --------------------------------------------------------------------------- 4. Dependencies (what changes if you change X)
# If you change..., It affects, Risk if done carelessly
DEPENDS = [
    ("A task status", "Open, blocked, late counts; brand health; menu dot; Overview tiles; team cards; My tasks; Excel export", "Low. Designed for daily use"),
    ("A task deadline", "Due flag, late count, health (At Risk), My tasks group, team card order", "Low"),
    ("A task team", "Which team card and list it appears in. Nothing else", "Low"),
    ("A brand stage", "Where the brand sits in the left menu and Overview. Only On Hold changes health (see next row)", "Low"),
    ("A brand stage to On Hold, or marking it paused", "Health On Hold; drops out of every Overview count and the signing plan weeks; My tasks moves its work to the bottom; SOW stage itself does not change", "Medium. Leadership stops seeing its late items"),
    ("SOW stage to Signed", "Brand health can become Live; SOW drops off the signing plan; due flag clears", "Medium. Check the SOW really is signed"),
    ("SOW stage to Blocked", "Brand health turns Blocked; red tag on the signing plan", "Medium. Needs a blocker line"),
    ("SOW target sign date", "Signing plan week, due flag, Overview 'to sign this week' tile", "Low"),
    ("A platform row to Blocked", "Brand health turns Blocked; access summary Blocked", "Medium"),
    ("A BP section to Blocked", "BP overall Blocked; brand health Blocked; BP grid order", "Medium"),
    ("A step to Done", "Onboarding %, current phase, gate checks for later steps", "Low. Gate rule protects order"),
    ("A step to N/A", "Removes it from the onboarding % total; can open a gate", "Medium. Can skip a gate by accident"),
    ("Gate or optional flag in the step list", "Which steps can be Done, which phase is current, onboarding % for every brand", "High. Affects all brands at once"),
    ("Renaming a step", "Text only. Progress is kept because the code stays", "Low"),
    ("Removing or renaming a list value (status, stage, team)", "Rows using the old value keep it but it no longer shows in dropdowns; a removed team moves its tasks to Other; counts that look for the exact word (Blocked, Complete, Signed) break if those words change", "High. Never rename Blocked, Complete, Signed, Granted, Not Needed, N/A, Done"),
    ("Adding a team", "New empty card on every brand; available in task editor and Excel", "Low"),
    ("Adding or removing a BP section", "BP progress and overall for every brand; BP grid columns; Excel BP sheet", "Medium. Changes every brand's BP %"),
    ("A person's name or other spellings", "Who sees which items in My tasks", "Medium. A typo hides someone's work"),
    ("Sharing access on the page", "Who can read and who can write", "High. Restricted brands are not protected yet"),
    ("Health rule (R10)", "Every dot, Overview tiles, brand header, exports", "High. Leadership reads this first"),
    ("Due Soon window (3 days)", "Every due flag, My tasks grouping, tiles", "High. Changes urgency for everyone"),
]

# --------------------------------------------------------------------------- 6. Change checklist
CHECKLIST = [
    ("Purpose", "Which group in 'Who it helps' asked for it, and what question does it answer?", "If nobody can name the group, park it"),
    ("Purpose", "Does a feature already do this? Check the Feature list first", "Improve the existing one instead of adding a second"),
    ("Simplicity", "Does it add a click to My tasks or a status change?", "Adding clicks to daily actions is a cost. Needs a strong reason"),
    ("Simplicity", "Does it add a column or panel to Simple view?", "Simple view should stay small. Put detail in Full"),
    ("Simplicity", "Can a busy person on a laptop understand it in 5 seconds?", "If not, simplify the words or the layout"),
    ("Numbers", "Does it change a rule in sheet 3 (health, due flag, %)?", "Leadership reads these. Agree the change with the product owner and note it here"),
    ("Numbers", "Will the Excel export still match the screen?", "Export uses the same rules. Update both"),
    ("Data", "Does it need a new field? Add it to sheet 5 with who fills it", "A field nobody fills is noise"),
    ("Data", "Does it rename or remove a list value?", "See sheet 4. Renaming key words breaks counts"),
    ("Data", "Does it affect the Excel round trip (export and import)?", "Add the column to both scripts or it will be ignored"),
    ("Access", "Who can use it: view only, member, editor?", "Check sheet 3, rule R18"),
    ("Access", "Does it show sensitive data (legal, contracts, money)?", "Links only, never contract text or valuations"),
    ("Safety", "Could two people edit the same thing at once?", "Save field by field so nobody overwrites the other"),
    ("Safety", "Is there a way to undo it?", "Change log shows old values. Big changes need a backup first"),
    ("Done", "Update this workbook: feature row, rules, dependencies, fields", "Run build_feature_map.py again"),
]

# --------------------------------------------------------------------------- 7. Known gaps
GAPS = [
    ("Restricted brands", "Only a tag. Anyone with access to the page can see restricted brands (Ponlu).", "Real limits come with the Supabase build", "High"),
    ("Member edit limit", "Members can only change their own tasks on screen, but the database allows any edit by anyone with interact access.", "Enforced in the database with Supabase", "Medium"),
    ("Email alerts", "No emails for blocked or late items yet.", "Stage 6", "Medium"),
    ("Restore from backup", "Backup download works. Restore is not built.", "Stage 6", "Medium"),
    ("Best Practices questions", "Sections match the BP sheet, but the checklist questions, scores, findings and tactics stay in the sheet.", "Could be imported per brand later", "Low"),
    ("Unconfirmed people", "12 names from the Excel not confirmed (team, external or same person).", "Settings > People", "Medium"),
    ("Team sorting", "Tasks were sorted into teams by keyword. Some will be wrong.", "Leads correct in one click", "Low"),
    ("Clients", "Client view is a downloaded snapshot file. Clients cannot log in to a live page of their own brand.", "Needs per-brand sign-in with the Supabase build", "Medium"),
    ("Notifications", "Mentions and changes show inside the tracker (My tasks, Since your last visit). Nothing is sent by email or Slack.", "Stage 6", "Medium"),
    ("Data gaps", "Most open tasks have no deadline and no brand has a lead, so late and stale signals undercount. Missing information on the Overview counts them.", "Team to fill", "High"),
    ("Not built", "Drag-and-drop board, saved named filters, brand colour tags, a task timeline.", "Low priority after the review", "Low"),
    ("Phone layout", "Works at phone width but designed for desktop first.", "Later stage", "Low"),
    ("Monday.com", "No step in the new checklist links to Monday.com yet.", "Out of scope for release 1", "Low"),
    ("Own platform", "Runs as a claude.ai page. Supabase, own domain and sign-in come later.", "Stage 1 of the original plan", "High"),
]

# --------------------------------------------------------------------------- 8. Feature history
HISTORY = [
    ("8 Oct 2026", "Tracker built: My tasks, Overview, brand pages, 61 steps with gates, SOW, platform access, BP, Settings, change log, Excel export", "All"),
    ("8 Oct 2026", "Data loaded: 22 brands, 179 tasks, 21 SOW rows, 6 platform rows, 10 BP rows", "All"),
    ("8 Oct 2026", "Team cards on the brand Tasks tab; every task given a team", "F31, F32, R12"),
    ("8 Oct 2026", "Editable Excel copy and import", "F70, F71"),
    ("13 Oct 2026", "Feature map workbook (this file)", "n/a"),
    ("13 Oct 2026", "Pictures added: 25 tagged screenshots, every feature row links to its screen", "n/a"),
    ("13 Oct 2026", "Fix: on hold now shows everywhere. Brand stage On Hold or paused flag counts as on hold on every screen (MugWipes still showed Internal Review in the signing plan). Brand header counts blocked steps. 33-check update test added", "R10, R19, F10, F20, F21, F30, F50"),
    ("13 Oct 2026", "Team Excel import (COE tracker 13 Oct + paid channels sheet): 61-step list replaced by the team's 53-step checklist with every tick loaded, Noor Squares added, 21 brand, 36 task, 40 SOW and 9 BP field updates, 8 new tasks, 45 paid platform rows (owner Ash Ghorab), GF status shown on SOW screens. Version 5", "F03, F35, F36, F40, F50, D03, D06"),
    ("13 Oct 2026", "Ashraf merged into Ash Ghorab (same person): 4 tasks and the KNDZ access row moved, Ashraf kept as an alias. Amazon rows: Pradnya's N/A means access is missing", "F60, F50"),
    ("13 Oct 2026", "New views: SOW progress board (Cat's layout, live from the onboarding steps) and Platform access grid (brand by platform). Phone width sideways scroll fixed on table pages. Version 6", "F54, F55, F50, F51"),
    ("13 Oct 2026", "Calmer design: soft sage, teal and pastel status colours in light and dark. Simple / Full replaced by View for: Leadership, Leads, Team. Pipeline added to the Overview. Version 7", "F04, F23, F54"),
    ("14 Oct 2026", "Review gaps closed: Needs attention, Blocked vs Has blockers, tile trends, sortable table, People view, verticals, search, Updates tab with mentions, since your last visit, gate sign-off record, task templates, client view, page guides. Faster with many brands. Version 11", "F07, F24 to F27, F43 to F45, F67, F10, F36"),
    ("14 Oct 2026", "Simple / Full back for everyone. Leadership view only for people given the Leadership role in Settings > People. My tasks: List or Board, group by brand, priority, due date, status or team, sort options, fold groups. Version 12", "F04, F10, F60"),
    ("14 Oct 2026", "Best Practices: 17 sections from the team's BP sheet (plus UGC), grouped; click a dot to set a section; summary columns first; brand tab shows grouped cards. Old statuses mapped and kept as a backup. Version 13", "F41, F52, F53"),
]

# --------------------------------------------------------------------------- build
HEAD = Font(bold=True, color="FFFFFF")
FILL = PatternFill("solid", fgColor="1D5C8A")
BAND = PatternFill("solid", fgColor="F0EDE6")
WRAP = Alignment(wrap_text=True, vertical="top")
THIN = Border(bottom=Side(style="thin", color="E3DFD6"))
RISK = {"High": "FDE3E0", "Medium": "FCEFCF", "Low": "DDF2E3"}

wb = Workbook()


def add(title, intro, cols, widths, rows, band_col=None, risk_col=None):
    ws = wb.create_sheet(title)
    ws["A1"] = title
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = intro
    ws["A2"].alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(cols))
    ws.row_dimensions[2].height = 34
    ws.append([])
    ws.append(cols)
    for i, w in enumerate(widths, 1):
        c = ws.cell(4, i)
        c.font, c.fill, c.alignment = HEAD, FILL, Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = w
    prev, shade = None, False
    for r in rows:
        ws.append(list(r))
        row = ws.max_row
        if band_col is not None:
            if r[band_col] != prev:
                shade, prev = not shade, r[band_col]
        for i in range(1, len(cols) + 1):
            c = ws.cell(row, i)
            c.alignment, c.border = WRAP, THIN
            if band_col is not None and shade:
                c.fill = BAND
        if risk_col is not None:
            key = str(r[risk_col]).split(".")[0]
            if key in RISK:
                ws.cell(row, risk_col + 1).fill = PatternFill("solid", fgColor=RISK[key])
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = f"A4:{get_column_letter(len(cols))}{ws.max_row}"
    return ws


rm = wb.active
rm.title = "Start here"
intro = [
    ("Valerie COE Tracker: feature map", ""),
    (VERSION, ""),
    ("", ""),
    ("What this is", "A plain list of everything the tracker does, who it helps, how its numbers are worked out and what depends on what."),
    ("Why it exists", "Before adding or changing a feature, check here what it touches and whether it makes the tracker better or worse."),
    ("", ""),
    ("Sheet", "Use it to"),
    ("Pictures", "Screenshots of every screen. Red tags (F10, F31...) mark where each feature is. Each feature row links to its picture."),
    ("1. Features", "See every function, where it is and who uses it. Each has an ID (F01, F02...)."),
    ("2. Who it helps", "See what leadership, leads, team members and other groups get from the tracker."),
    ("3. Rules", "See how health, due flags, % and the gate rule are worked out. IDs R01, R02..."),
    ("4. What affects what", "Before a change: what else moves, and how risky it is (green, amber, red)."),
    ("5. Data", "Every piece of information the tracker stores, who fills it and what uses it. IDs D01, D02..."),
    ("6. Change checklist", "Questions to answer before building a new feature."),
    ("7. Known gaps", "What is not built or not safe yet."),
    ("8. History", "What changed and when. Add a row with every change."),
    ("", ""),
    ("Quick example", "Idea: add a Priority filter to My tasks. 1) Features: F10 already sorts by urgency, so check whether a filter adds value. 2) Checklist: it adds a click to the daily page, so it needs a strong reason. 3) What affects what: nothing else changes. Decision: likely skip, or put it in Full view only."),
]
for a, b in intro:
    rm.append([a, b])
rm["A1"].font = Font(bold=True, size=16)
rm["A2"].font = Font(italic=True, color="5F6670")
for r in (4, 5, 7, 18):
    rm.cell(r, 1).font = Font(bold=True)
rm["A7"].fill = rm["B7"].fill = FILL
rm["A7"].font = rm["B7"].font = HEAD
rm.column_dimensions["A"].width = 24
rm.column_dimensions["B"].width = 110
for row in rm.iter_rows():
    for c in row:
        c.alignment = WRAP

# pictures sheet first, so feature rows can link to it
pic_row = {}
if SHOTS:
    from openpyxl.drawing.image import Image as XLImage
    ps = wb.create_sheet("Pictures")
    ps["A1"] = "Pictures"
    ps["A1"].font = Font(bold=True, size=14)
    ps["A2"] = "Real screens of the tracker. Red tags show the feature IDs from sheet 1. Taken from a copy of the live data; nothing was changed in the tracker."
    ps.column_dimensions["A"].width = 160
    row = 4
    for sh in SHOTS:
        ps.cell(row, 1, f"{sh['id']}  {sh['title']}").font = Font(bold=True, size=13, color="1D5C8A")
        ps.cell(row + 1, 1, f"Features shown: {sh['features']}").font = Font(italic=True, color="5F6670")
        img = XLImage(os.path.join(SHOTS_DIR, sh["file"]))
        img.width, img.height = int(img.width * 0.62), int(img.height * 0.62)
        ps.add_image(img, f"A{row + 2}")
        for f in [x.strip() for x in sh["features"].split(",")]:
            pic_row.setdefault(f, []).append((sh["id"], row))
        row += 2 + int(img.height / 20) + 3
    ps.freeze_panes = "A3"

feat_rows = [r + (", ".join(i for i, _ in pic_row.get(r[0], [])) or "No picture",) for r in FEATURES]
fs = add("1. Features", "Every function of the tracker. Filter by Area or Who uses it. 'Rules used' and 'Data used' point to sheets 3 and 5. Click a picture ID to see the screen.",
    ["ID", "Area", "Feature", "What it does", "Where to find it", "Who uses it", "Rules used", "Data used", "Simple view", "Picture"],
    [7, 16, 26, 70, 26, 22, 16, 16, 20, 14], feat_rows, band_col=1)
for r in range(5, fs.max_row + 1):
    fid = fs.cell(r, 1).value
    if fid in pic_row:
        c = fs.cell(r, 10)
        c.hyperlink = Hyperlink(ref=c.coordinate, location=f"'Pictures'!A{pic_row[fid][0][1]}", display=c.value)
        c.font = Font(color="1D5C8A", underline="single")
add("2. Who it helps", "What each group asks and where the tracker answers it.",
    ["Group", "Question they ask", "Where the tracker answers it", "Features"],
    [34, 50, 54, 16], AUDIENCE, band_col=0)
add("3. Rules", "How the tracker works out every number and flag. Most come from the old COE Excel formulas so numbers match.",
    ["ID", "Rule", "How it works", "Where it shows", "Source"],
    [7, 28, 80, 30, 22], RULES)
add("4. What affects what", "Before changing something, find it in the first column. Risk: green low, amber medium, red high.",
    ["If you change...", "It affects", "Risk"],
    [38, 80, 46], DEPENDS, risk_col=2)
add("5. Data", "Every kind of record the tracker keeps. If a feature needs new information, add it here first.",
    ["ID", "Record", "Fields", "Meaning", "Filled by", "Used by features", "Used by rules"],
    [7, 18, 60, 26, 26, 36, 26], FIELDS)
ws = add("6. Change checklist", "Answer each question before building a new feature or change. Fill the Answer column for the change you are judging.",
         ["Area", "Question", "Why it matters", "Answer"],
         [14, 64, 60, 30], CHECKLIST, band_col=0)
dv = DataValidation(type="list", formula1='"Yes,No,Not sure,n/a"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f"D5:D{ws.max_row}")
add("7. Known gaps", "Not built or not safe yet. New ideas should not assume these exist.",
    ["Gap", "What it means today", "Plan", "Impact"],
    [26, 70, 40, 12], GAPS, risk_col=3)
add("8. History", "Add one row each time the tracker changes, with the feature IDs it touched.",
    ["Date", "Change", "Features / rules touched"],
    [14, 90, 30], HISTORY)

if SHOTS:
    wb.move_sheet("Pictures", offset=-(wb.sheetnames.index("Pictures") - 1))
wb.save(OUT)
print("saved", OUT, {"features": len(FEATURES), "audience": len(AUDIENCE), "rules": len(RULES), "depends": len(DEPENDS),
                     "fields": len(FIELDS), "checklist": len(CHECKLIST), "gaps": len(GAPS)})
