export const site = {
  name: "Jia (Kevin) Yu",
  shortName: "Kevin Yu",
  initials: "JY",
  role: "Senior Data Scientist",
  location: "United States",
  email: "jiakevinyu@gmail.com",
  phone: "+1 (832) 277-1669",
  phoneDisplay: "(832) 277-1669",
  // NOTE: update this handle to your real profile if it differs.
  social: {
    linkedin: "https://www.linkedin.com/in/jiakevinyu",
  },
  tagline: "I turn ambiguous data into decisions worth trusting.",
  summary:
    "Senior Data Scientist working at the intersection of statistics, engineering, and business strategy — building models and pipelines that hold up under financial, marketing, and regulatory scrutiny.",
} as const;

export const heroStats = [
  { value: "$1B+", label: "in models validated for financial risk" },
  { value: "4M+", label: "users reached through automated targeting" },
  { value: "$61M+", label: "in measurable business impact driven" },
  { value: "6", label: "years across data science & engineering" },
] as const;

export type Project = {
  slug: string;
  title: string;
  org: string;
  period: string;
  description: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  demo?: string;
  featured?: boolean;
  confidential?: boolean;
};

export const projects: Project[] = [
  {
    slug: "audience-segmentation-automation",
    title: "Audience Segmentation Migration & Automation",
    org: "Digitas",
    period: "2025 — Present",
    description:
      "Led the migration of audience segmentation from SAS/Adobe onto Salesforce Data Cloud, re-architecting how campaign audiences are built and automating what used to be a manual, multi-day process.",
    metrics: [
      { label: "faster campaign launch", value: "95%" },
      { label: "users targeted", value: "4M+" },
      { label: "lift from A/B testing", value: "+11%" },
    ],
    tags: ["SQL", "Snowflake", "Salesforce Data Cloud", "Marketing Cloud", "SAS", "LiveRamp"],
    featured: true,
    confidential: true,
  },
  {
    slug: "enterprise-model-risk-validation",
    title: "Enterprise Model Risk Validation Program",
    org: "Toyota Financial Services",
    period: "2023 — 2025",
    description:
      "Owned end-to-end validation of core models governing $1B+ in loan originations, collections, retention, and financial reporting — auditing data pipelines, code, and monitoring against regulatory standards across 15+ collaborating teams.",
    metrics: [
      { label: "in risk coverage", value: "$1B+" },
      { label: "reduction in capital reserves", value: "$40M" },
      { label: "teams aligned on findings", value: "15+" },
    ],
    tags: ["Python", "SAS", "SQL", "Model Governance", "Statistical Testing"],
    featured: true,
    confidential: true,
  },
  {
    slug: "xgboost-sales-forecasting",
    title: "XGBoost Auto-Sales Forecasting Engine",
    org: "Toyota Financial Services",
    period: "2021 — 2023",
    description:
      "Built a segment-level XGBoost model to forecast auto sales and a modular ETL/Python framework that automated retraining and production scoring end to end.",
    metrics: [
      { label: "prediction accuracy", value: "85%" },
      { label: "revenue optimization", value: "$21M" },
    ],
    tags: ["Python", "XGBoost", "AWS SageMaker", "Redshift", "Athena", "ETL"],
    confidential: true,
  },
  {
    slug: "clippers-ticket-revenue",
    title: "Ticket Inventory Revenue Optimization",
    org: "LA Clippers",
    period: "2021",
    description:
      "Analyzed season-ticket usage patterns to uncover unmonetized inventory and proposed a fixed-price seating product — now known as The Wall at Intuit Dome — backed by projections and confidence intervals.",
    metrics: [
      { label: "unused inventory uncovered", value: "$2.6M" },
      { label: "projected revenue lift", value: "+6%" },
    ],
    tags: ["Python", "R", "SQL", "Power BI", "Tableau"],
    confidential: true,
  },
];

export type ExperienceEntry = {
  org: string;
  role: string;
  period: string;
  bullets: string[];
  tech: string[];
};

export const experience: ExperienceEntry[] = [
  {
    org: "Digitas",
    role: "Senior Data Scientist — Marketing / Advertising",
    period: "Aug 2025 — Present",
    bullets: [
      "Spearheaded migration of audience segmentation from SAS/Adobe to Salesforce, automating ad campaign builds targeting 4M+ users and cutting launch time by 95%.",
      "Designed A/B testing experiments to measure incremental lift of ad campaigns, identifying an 11% increase in customer activity.",
    ],
    tech: ["SQL", "Snowflake", "Jira", "Salesforce Data Cloud", "Salesforce Marketing Cloud", "SAS", "Teradata", "LiveRamp"],
  },
  {
    org: "Toyota Financial Services",
    role: "Data Scientist — Model Validation",
    period: "Jun 2023 — Jul 2025",
    bullets: [
      "Led the enterprise model validation function — conducted and managed end-to-end assessments of core models to mitigate $1B+ in financial risk across loan originations, collections, customer retention, asset valuation, accounting, and reporting.",
      "Identified findings across data pipelines, code development, monitoring, and implementation, driving process remediations and a $40M reduction in capital reserves.",
      "Collaborated with 15+ teams to understand each model's business purpose and risks, presenting validation reports to senior management and executives.",
    ],
    tech: ["Python", "SAS", "SQL", "Snowflake", "Model Governance"],
  },
  {
    org: "Toyota Financial Services",
    role: "Data Scientist — Revenue Optimization",
    period: "Dec 2021 — Jun 2023",
    bullets: [
      "Developed an XGBoost model predicting auto sales by segment with 85% accuracy, contributing to $21M in revenue optimization.",
      "Built a modular ETL pipeline and Python framework to streamline model workflows, including retraining and production scoring.",
    ],
    tech: ["Python", "SAS", "SQL", "Snowflake", "AWS SageMaker", "Athena", "Redshift", "Tableau", "Git", "Agile"],
  },
  {
    org: "LA Clippers",
    role: "Business Intelligence / Data Analyst Intern — Product & Ticketing",
    period: "Jun 2021 — Nov 2021",
    bullets: [
      "Performed pricing analysis and introduced a first-come, first-serve fixed-cost seating strategy (The Wall at Intuit Dome), projected to increase revenue by 6%.",
      "Analyzed season ticket holder usage, uncovering $2.6M in unused seat revenue and proposing a product concept to monetize underutilized inventory.",
    ],
    tech: ["Python", "R", "SQL", "Google Colab", "Power BI", "Tableau"],
  },
  {
    org: "HCSS",
    role: "Software Developer",
    period: "Jul 2019 — Aug 2020",
    bullets: [
      "Designed and built custom reporting tools to export construction project data into Excel, streamlining workflows for 30+ clients and improving efficiency by up to 96% — directly leading to $255K in revenue.",
      "Owned the end-to-end development lifecycle for custom product features through direct collaboration with client teams.",
    ],
    tech: ["C#", "SQL", "Visual DataFlex", "XtraReports", "Jira", "Agile Scrum"],
  },
  {
    org: "Charles Schwab",
    role: "SDET Engineer",
    period: "Jan 2019 — Jul 2019",
    bullets: [
      "Developed an automated testing process using C#, Selenium, and SQL to reach 80% coverage across web navigation, API calls, and data population.",
      "Led 2 QA teams through installation support, systems verification, project management, and stakeholder demos.",
    ],
    tech: ["SQL", "Swagger", "SPARTA", "Jira", "Bitbucket", "Zephyr", "Agile Scrum"],
  },
];

export type EducationEntry = {
  school: string;
  degree: string;
  period?: string;
};

export const education: EducationEntry[] = [
  { school: "Georgia Institute of Technology", degree: "M.S. in Computer Science" },
  { school: "University of Houston", degree: "M.S. in Statistics and Data Science", period: "2021" },
  { school: "University of Houston", degree: "B.S. in Computer Science and Mathematics", period: "2018" },
];

export type SkillGroup = {
  title: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    items: ["Python", "SQL", "R", "Java", "C++", "C#", "SAS"],
  },
  {
    title: "Machine Learning & Statistics",
    items: [
      "Scikit-learn",
      "XGBoost",
      "LightGBM",
      "TensorFlow",
      "PyTorch",
      "Keras",
      "SHAP / LIME",
      "Time Series Forecasting",
      "NLP",
    ],
  },
  {
    title: "Data Engineering",
    items: ["PySpark", "Spark", "Hadoop", "Hive", "Airflow", "Snowflake", "AWS (S3, Redshift, Lambda, SageMaker)", "Teradata"],
  },
  {
    title: "Visualization & BI",
    items: ["Tableau", "Power BI", "Matplotlib", "Seaborn", "Plotly"],
  },
  {
    title: "Tools & Platforms",
    items: ["Git", "Docker", "Jupyter", "VS Code", "Postman", "Jira / Confluence", "Agile / Scrum", "Claude Code"],
  },
];

export const nav = [
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Projects", href: "/#projects" },
  { label: "Skills", href: "/#skills" },
  { label: "Contact", href: "/#contact" },
  { label: "War Room", href: "/fantasy" },
] as const;
