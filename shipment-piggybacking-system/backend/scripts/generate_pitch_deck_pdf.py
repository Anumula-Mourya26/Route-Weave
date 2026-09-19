import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 752, "SH-205 Intelligent Shipment Piggybacking Platform")
            self.drawRightString(612 - 54, 752, "Technical Architecture & Demo Reference")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 746, 612 - 54, 746)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "Team Malwifi · Autonomous Linehaul Logistics Engine · Telangana Corridor Grid")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0f172a")     # Slate 900
    c_accent = colors.HexColor("#6d28d9")      # Purple 700
    c_success = colors.HexColor("#047857")     # Emerald 700
    c_danger = colors.HexColor("#b91c1c")      # Rose 700
    c_text = colors.HexColor("#334155")        # Slate 700
    c_muted = colors.HexColor("#64748b")       # Slate 500
    c_bg_light = colors.HexColor("#f8fafc")    # Slate 50
    c_border = colors.HexColor("#e2e8f0")      # Slate 200

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_text,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_text
    )

    story = []

    # =========================================================================
    # HEADER BANNER & METADATA
    # =========================================================================
    story.append(Paragraph("SH-205 Intelligent Shipment Piggybacking", title_style))
    story.append(Paragraph("Technical Architecture & Live Demonstration Reference Guide", subtitle_style))

    # Meta KPI block
    meta_data = [
        [
            Paragraph("<b>Track:</b> Autonomous Supply Chain & Logistics", table_cell),
            Paragraph("<b>Target Region:</b> Telangana Linehaul Grid (NH 163, NH 65, NH 44)", table_cell),
            Paragraph("<b>Status:</b> Production Ready Hackathon Pitch", table_cell)
        ],
        [
            Paragraph("<b>Engine:</b> Google OR-Tools CVRPTW", table_cell),
            Paragraph("<b>Dataset Scale:</b> 200 Shipments · 32 Hubs · 75 Fleet Trucks", table_cell),
            Paragraph("<b>Avg Solution Time:</b> &lt; 28.5 ms", table_cell)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[170, 180, 154])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & THE SH-205 PROBLEM
    # =========================================================================
    story.append(Paragraph("1. Executive Summary & The SH-205 Problem", h1_style))
    
    story.append(Paragraph(
        "Modern surface freight logistics is plagued by an expensive, fragile operational failure: "
        "<b>stranded, misrouted, and delayed shipments</b>. In intermediate transfer corridors, cargo is routinely offloaded "
        "at the wrong transit facility (e.g., misrouted to Nalgonda H07 instead of direct transit along the NH-163 corridor to Warangal H02).",
        body_style
    ))

    # Callout Comparison Table: Traditional vs SH-205
    comp_data = [
        [
            Paragraph("<b>Failure Mode (The Status Quo)</b>", table_header),
            Paragraph("<b>Autonomous Recovery (SH-205 Innovation)</b>", table_header)
        ],
        [
            Paragraph(
                "• <b>Dedicated Spot-Hire Dispatch:</b> Dispatchers hire emergency hotshot trucks costing ₹35–₹45/km.<br/>"
                "• <b>Empty Deadhead Waste:</b> Recovery trucks travel 100% empty to reach the stranded hub.<br/>"
                "• <b>SLA Breaches:</b> Manual rebooking takes 4–8 hours, triggering severe commercial penalties.<br/>"
                "• <b>Cost Impact:</b> ₹8,500–₹12,500 per recovery incident with high carbon footprint.",
                table_cell
            ),
            Paragraph(
                "• <b>Dynamic Piggybacking:</b> Identifies active linehaul trucks with unutilized spare capacity.<br/>"
                "• <b>Zero Empty Deadheads:</b> Injects stranded cargo into pre-scheduled routes passing nearby.<br/>"
                "• <b>Sub-Second Autonomous Convergence:</b> CVRPTW solver calculates optimal plan in &lt; 30 ms.<br/>"
                "• <b>Economic ROI:</b> <b>₹6,500 net savings (76.5% reduction)</b> and <b>250 kg CO₂ avoided</b> per recovery.",
                table_cell
            )
        ]
    ]
    comp_table = Table(comp_data, colWidths=[252, 252])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#fef2f2")),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#f0fdf4")),
        ('BACKGROUND', (0, 1), (0, 1), colors.HexColor("#fffafb")),
        ('BACKGROUND', (1, 1), (1, 1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & TECH STACK
    # =========================================================================
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    story.append(Paragraph(
        "The SH-205 platform uses a modern, decoupled microservices architecture designed for extreme responsiveness, "
        "strict geospatial precision, and transparent multi-stage visual lifecycle management:",
        body_style
    ))

    stack_data = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>Technologies Used</b>", table_header), Paragraph("<b>Architectural Responsibility</b>", table_header)],
        [
            Paragraph("<b>Frontend UI & Map Engine</b>", table_cell),
            Paragraph("• React 19 / Vite<br/>• Tailwind CSS 3<br/>• Leaflet.js (^1.9.4)<br/>• react-leaflet (^5.0.0)", table_cell),
            Paragraph("Autonomous Control Center with progressive 3-stage visual state machine. Uses public OpenStreetMap vector tiles, custom SVG markers, dynamic polyline rendering, and MapController viewport invalidation.", table_cell)
        ],
        [
            Paragraph("<b>Backend API & WebSockets</b>", table_cell),
            Paragraph("• Python 3.13<br/>• FastAPI (ASGI)<br/>• Uvicorn Server<br/>• WebSocket Channels", table_cell),
            Paragraph("RESTful endpoints handling disruption injection (/api/shipments/disrupt), candidate matching (/api/recovery/match), optimization (/api/recovery/optimize), and broadcast event synchronization.", table_cell)
        ],
        [
            Paragraph("<b>AI Optimization Engine</b>", table_cell),
            Paragraph("• Google OR-Tools<br/>• CVRPTW Constraint Solver<br/>• NumPy & SciPy", table_cell),
            Paragraph("Executes multi-objective mathematical optimization evaluating capacity constraints, time windows, detour distances, and fuel-cost trade-offs.", table_cell)
        ],
        [
            Paragraph("<b>Database & Geospatial Layer</b>", table_cell),
            Paragraph("• PostgreSQL 16<br/>• PostGIS Extension<br/>• Supabase DB / REST", table_cell),
            Paragraph("Persistent storage of 200 shipments, 75 linehaul trucks, and 32 regional transit hubs. Enforces geospatial proximity indexing and atomic state persistence upon plan acceptance.", table_cell)
        ]
    ]
    stack_table = Table(stack_data, colWidths=[110, 134, 260])
    stack_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(stack_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 3: THE AI OPTIMIZATION ENGINE (HOW IT WORKS)
    # =========================================================================
    story.append(Paragraph("3. The AI Optimization Engine (Algorithmic Logic for Judges)", h1_style))
    story.append(Paragraph(
        "When explaining the AI solver to the jury, present the system as a <b>three-step deterministic decision pipeline</b> "
        "backed by Google OR-Tools Capacitated Vehicle Routing with Time Windows (CVRPTW):",
        body_style
    ))

    # Step 1
    story.append(Paragraph("Step A: Hard Capacity Feasibility Filtering", h2_style))
    story.append(Paragraph(
        "The engine first queries the active fleet database to enforce the fundamental physical payload constraint: "
        "<code>truck.Available_Capacity_kg &gt;= shipment.Weight_kg</code>. For instance, stranded shipment <b>SH004</b> weighs "
        "<b>4,500 kg (4.5 Tons)</b>. The solver scans candidates and isolates vehicle <b>TRK-004 (V004)</b>, which has a 14.0T rating, "
        "currently carries 6.0T base freight, and holds <b>8.0 Tons (8,000 kg) of verified spare capacity</b>. "
        "Payload utilization expands safely from 42.8% to 75.0% without violating axle weight regulations.",
        bullet_style
    ))

    # Step 2
    story.append(Paragraph("Step B: Geographic Corridor Trajectory Alignment", h2_style))
    story.append(Paragraph(
        "Instead of dispatching trucks from distant depots, the algorithm evaluates vehicles whose pre-scheduled route corridors "
        "already traverse the stranded consignment's vicinity. In our primary scenario, TRK-004 is travelling along the route "
        "<code>[H06 Mahbubnagar ➔ H01 Hyderabad ➔ H07 Nalgonda ➔ H02 Warangal]</code>. Because Nalgonda (H07) is already a scheduled waypoint "
        "on TRK-004's transit manifest, the detour addition is <b>0.0 km</b>, achieving a 100% trajectory match.",
        bullet_style
    ))

    # Step 3
    story.append(Paragraph("Step C: Multi-Objective Recovery Economics Formulation", h2_style))
    story.append(Paragraph(
        "The optimization objective function minimizes total operational penalty across three weighted dimensions: "
        "$$\\min Z = w_{\\text{cost}} \\cdot \\Delta C + w_{\\text{time}} \\cdot \\Delta T + w_{\\text{carbon}} \\cdot \\Delta E$$. "
        "The economic parameters are derived directly from the cost configuration matrix:",
        bullet_style
    ))

    econ_data = [
        [Paragraph("<b>Metric Dimension</b>", table_header), Paragraph("<b>Spot-Hire Benchmark</b>", table_header), Paragraph("<b>SH-205 Piggyback Engine</b>", table_header), Paragraph("<b>Net Savings Benefit</b>", table_header)],
        [
            Paragraph("<b>Cost of Recovery (₹)</b>", table_cell),
            Paragraph("₹8,500 (Dedicated Truck @ ₹35/km + handling)", table_cell),
            Paragraph("₹2,000 (Incremental handling + fuel surcharge)", table_cell),
            Paragraph("<b>₹6,500 Saved (76.5% Direct Savings)</b>", table_cell)
        ],
        [
            Paragraph("<b>Added Road Mileage</b>", table_cell),
            Paragraph("186.8 km (Empty round-trip deadhead)", table_cell),
            Paragraph("0.0 km – 16.8 km (Corridor intercept)", table_cell),
            Paragraph("<b>170+ km Deadheading Eliminated</b>", table_cell)
        ],
        [
            Paragraph("<b>CO₂ Carbon Emissions</b>", table_cell),
            Paragraph("310 kg CO₂ (Dedicated diesel burn)", table_cell),
            Paragraph("60 kg CO₂ (Incremental load resistance)", table_cell),
            Paragraph("<b>250 kg CO₂ Avoided</b>", table_cell)
        ],
        [
            Paragraph("<b>SLA Delivery Compliance</b>", table_cell),
            Paragraph("Risk of 4–8 hr delay for vehicle dispatch", table_cell),
            Paragraph("On-schedule pickup during scheduled truck stop", table_cell),
            Paragraph("<b>Delivered 2.0 hrs ahead of deadline</b>", table_cell)
        ]
    ]
    econ_table = Table(econ_data, colWidths=[120, 130, 130, 124])
    econ_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(econ_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: THE DATASET (TELANGANA LOGISTICS NETWORK)
    # =========================================================================
    story.append(Paragraph("4. The Dataset (Telangana Logistics Network Scale)", h1_style))
    story.append(Paragraph(
        "Our system is not a synthetic toy model—it operates on a comprehensive enterprise dataset mirroring real-world "
        "inter-district logistics operations across Telangana and surrounding corridors:",
        body_style
    ))

    data_scale = [
        [
            Paragraph("<b>32 Regional Hubs</b>", h2_style),
            Paragraph("<b>75 Linehaul Trucks</b>", h2_style),
            Paragraph("<b>Cost Matrix & Rates</b>", h2_style)
        ],
        [
            Paragraph(
                "• <b>Primary Hubs:</b> Hyderabad (H01), Warangal (H02), Nizamabad (H03), Karimnagar (H04), Khammam (H05).<br/>"
                "• <b>Intermediate Transfer Hubs:</b> Nalgonda (H07), Siddipet (H10), Suryapet (H14), Bhongir (H16), Sangareddy (H18).<br/>"
                "• <b>Geospatial Precision:</b> Exact PostGIS coordinates snapped to NH 163, NH 65, NH 44, and SH 24.",
                table_cell
            ),
            Paragraph(
                "• <b>Heavy Duty:</b> 14.0T Multi-Axle Trucks (e.g. TRK-004 with 8.0T spare).<br/>"
                "• <b>Medium Duty:</b> 7.5T &amp; 10.0T Medium Commercial Vehicles (MCV).<br/>"
                "• <b>Feeder Fleet:</b> 3.5T &amp; 5.0T Light Commercial Vehicles (LCV).<br/>"
                "• <b>Telemetry:</b> Real-time GPS location, driver ID, route manifest, and cargo load tracking.",
                table_cell
            ),
            Paragraph(
                "• <b>Operating Cost:</b> ₹40–₹50 per km linehaul rate.<br/>"
                "• <b>Driver Base Pay:</b> ₹800–₹1,200 per transit shift.<br/>"
                "• <b>Hub Handling Fee:</b> ₹400–₹500 per transshipment.<br/>"
                "• <b>Spot Hire Baseline:</b> ₹35.0/km dedicated deadhead rate + ₹2,000 emergency surcharge.",
                table_cell
            )
        ]
    ]
    scale_table = Table(data_scale, colWidths=[168, 168, 168])
    scale_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(scale_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: THE LIVE DEMO FLOW (STEP-BY-STEP SCRIPT)
    # =========================================================================
    story.append(Paragraph("5. The Live Demo Flow (Step-by-Step Script for the Pitch)", h1_style))
    story.append(Paragraph(
        "Follow this exact 4-step sequence during the live hackathon presentation to demonstrate technical mastery:",
        body_style
    ))

    demo_steps = [
        [Paragraph("<b>Step &amp; UI Location</b>", table_header), Paragraph("<b>Action to Take</b>", table_header), Paragraph("<b>Visual Screen State &amp; What to Tell Judges</b>", table_header)],
        [
            Paragraph("<b>Step 1: Clean Startup</b><br/><code>/dashboard</code>", table_cell),
            Paragraph("Show the initial executive Control Center.", table_cell),
            Paragraph("<b>State 1: Zero Initial Anomalies.</b> Point out that the grid begins clean with 0 stranded consignments. The map renders the standard blue intended corridor connecting Hyderabad (H01) and Warangal (H02).", table_cell)
        ],
        [
            Paragraph("<b>Step 2: Disruption Injection</b><br/><code>/disruption-engine</code>", table_cell),
            Paragraph("Navigate to Disruption Engine. Select <b>SH004 (Tata Motors, 4.5T)</b> and target hub <b>Nalgonda (H07)</b>. Click <b>'Inject Disruption'</b>.", table_cell),
            Paragraph("<b>State 2: Transit Anomaly Generated.</b> Spatial constraint enforces intermediate transfer (~50km off destination). Database persistently executes <code>UPDATE shipments SET shipment_status='Misplaced'</code>. Auto-navigates to Control Tower: map clears intended line, showing 🚨 pulsing stranded marker at H07 and top 3 nearest candidate trucks with amber proximity badges.", table_cell)
        ],
        [
            Paragraph("<b>Step 3: AI Recovery Solver</b><br/>Control Tower Header", table_cell),
            Paragraph("Click <b>'⚡ Run AI Recovery'</b>.", table_cell),
            Paragraph("<b>State 3: Algorithmic Convergence.</b> Google OR-Tools CVRPTW solver executes in &lt; 30 ms. Identifies TRK-004 with 8.0T spare capacity. Map morphs dynamically to display the three diagnostic polylines:<br/>"
                      "• 🔴 <b>Red Polyline:</b> 93.4 km deviation path (H01 ➔ H07)<br/>"
                      "• 🔵 <b>Blue Dashed Line:</b> Original scheduled route (H01 ➔ H02)<br/>"
                      "• 🟢 <b>Green Polyline:</b> Optimized piggyback recovery (H07 ➔ H02)", table_cell)
        ],
        [
            Paragraph("<b>Step 4: Acceptance &amp; Persistence</b><br/>Action Bar", table_cell),
            Paragraph("Click <b>'Accept Changes'</b>.", table_cell),
            Paragraph("<b>State 4: Permanent State Locking.</b> The database is atomically updated (<code>status='Recovered', is_recovery_accepted=true</code>). The map <b>persistently retains all 3 polylines (Red, Blue, Green)</b> for continuous visual context. KPI card increments Total Cost Saved to +₹6,500 and avoided carbon by 250 kg.", table_cell)
        ]
    ]
    demo_table = Table(demo_steps, colWidths=[105, 125, 274])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 14))

    # Concluding Verdict
    story.append(Paragraph(
        "<b>Summary for the Judges:</b> SH-205 transforms logistics disruption from an expensive manual crisis into an "
        "automated, zero-deadhead optimization opportunity. By utilizing real linehaul telemetry, PostgreSQL/PostGIS persistence, "
        "and Google OR-Tools, the system achieves <b>76.5% cost reduction</b>, eliminates secondary vehicles, and preserves 100% SLA integrity.",
        callout_style
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Successfully generated at: {filename}")

if __name__ == "__main__":
    out_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else "SH205_Technical_Architecture_and_Demo_Reference.pdf"
    build_pdf(out_path)
