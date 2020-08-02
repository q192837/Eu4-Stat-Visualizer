const DataPoints : string[] = ['history', 'national_focus', 'technology_cost', 'is_at_war', 'num_of_mercenaries', 'num_of_regulars', 'num_of_colonies', 'num_of_heathen_provs',
'republican_tradition', 'root_out_corruption_sliderlegitimacy', 'absolutism', 'government_rank', 'religion', 'capital', 'trade_port', 'base_tax', 'raw_development', 'adm_tech',
'dip_tech', 'mil_tech', 'current_power_projection', 'great_power_score', 'score', 'navy_strength', 'total_war_worth', 'num_of_rebel_controlled_provinces', 'num_of_rebel_armies',
'num_owned_home_cores', 'non_overseas_developmen', 'num_of_controlled_cities', 'num_of_total_ports', 'num_of_cities', 'forts', 'num_of_allies', 'num_of_royal_marriages',
'num_of_subjects', 'average_unrest', 'average_autonomy', 'prestige', 'stability', 'treasury', 'estimated_monthly_income', 'land_maintenance', 'naval_maintenance',
'colonial_maintenance', 'missionary_maintenance', 'army_tradition', 'navy_tradition', 'lastmonthincome', 'lastmonthincometable', 'lastmonthexpense', 'lastmonthexpensetable', 'loan_size',
'estimated_loan', 'religious_unity', 'meritocracy', 'corruption', 'mercantilism', 'splendor', 'active_idea_groups', 'army_professionalism', 'manpower', 'max_manpower', 'max_sailors', 'wants_to_be_great_power', 'needs_regiments',
'needs_buildings', 'needs_ships']


const ActiveCountries : Map<string, Map<string, string>> = new Map([
    ["TUR", new Map([["displayName", "Ottomans"], ["color", "126 203 120"]])],
    ["FRA", new Map([["displayName", "France"], ["color", "20 50 210"]])],
    ["ENG", new Map([["displayName", "England"], ["color", "193 26 14"]])],
    ["MNG", new Map([["displayName", "Ming"], ["color", "179 128 104"]])],
]);

export function populateVariableSelect() : void {
    const variableSelect = document.getElementById("variableSelect");
    DataPoints.forEach((variable: string) => {
        const option = document.createElement("option");
        option.value = variable;
        option.text = variable.replace(/_/g, ' ');
        variableSelect.appendChild(option);
    });
}

export function getActiveTags() : string[] {
    return Array.from(ActiveCountries.keys());
}

export function getActiveTagColors() : string[] {
    const colors: string[] = [];
    ActiveCountries.forEach((properties: Map<string, string>, tag) =>{
        const rbgColorString = properties.get("color").split(" ").join(", ");
        colors.push(`rgb(${ rbgColorString })`);
    });
    return colors;
}

export function populateGraphCheckBoxes() : void {
    const optionsBox = document.getElementById("optionsBox");
    ActiveCountries.forEach((properties: Map<string, string>, tag) =>{
        const tagOption = document.createElement("div");
        tagOption.className = "tagOption";
        const tagCheckbox = document.createElement("input");
        tagCheckbox.type = "checkbox";
        tagCheckbox.id = tag;
        tagCheckbox.name = "tag";
        const tagCheckboxLabel = document.createElement("label");
        tagCheckboxLabel.htmlFor = tag;
        tagCheckboxLabel.innerHTML = properties.get("displayName")
        tagOption.appendChild(tagCheckbox);
        tagOption.appendChild(tagCheckboxLabel);
        optionsBox.appendChild(tagOption);
    })
}