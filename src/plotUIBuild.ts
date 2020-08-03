const DataPointsForLineGraph : string[] = ['num_of_mercenaries', 'num_of_regulars', 'num_of_colonies', 'num_of_heathen_provs','republican_tradition',
'root_out_corruption_sliderlegitimacy', 'absolutism', 'base_tax', 'raw_development', 'adm_tech','dip_tech', 'mil_tech', 'current_power_projection',
'great_power_score', 'score', 'navy_strength', 'total_war_worth', 'num_of_rebel_controlled_provinces', 'num_of_rebel_armies','num_owned_home_cores',
'non_overseas_developmen', 'num_of_controlled_cities', 'num_of_total_ports', 'num_of_cities', 'forts', 'num_of_allies', 'num_of_royal_marriages',
'num_of_subjects', 'average_unrest', 'average_autonomy', 'prestige', 'stability', 'treasury', 'estimated_monthly_income', 'land_maintenance',
'naval_maintenance', 'colonial_maintenance', 'missionary_maintenance', 'army_tradition', 'navy_tradition', 'lastmonthincome', 'lastmonthincometable',
'lastmonthexpense', 'loan_size', 'estimated_loan', 'religious_unity', 'corruption', 'mercantilism', 'splendor', 'army_professionalism', 'manpower',
'max_manpower', 'max_sailors']


const ActiveCountries : Map<string, Map<string, string>> = new Map([
    ["TUR", new Map([["displayName", "Ottomans"], ["color", "126 203 120"]])],
    ["FRA", new Map([["displayName", "France"], ["color", "20 50 210"]])],
    ["ENG", new Map([["displayName", "England"], ["color", "193 26 14"]])],
    ["MNG", new Map([["displayName", "Ming"], ["color", "179 128 104"]])],
    ["MAM", new Map([["displayName", "Mamlucks"], ["color", "188 166 93"]])],
    ["HAB", new Map([["displayName", "Austria"], ["color", "220 220 220"]])],
    ["VEN", new Map([["displayName", "Venice"], ["color", "54 167 156"]])],
    ["CAS", new Map([["displayName", "Castile"], ["color", "193 171 8"]])],
    ["POL", new Map([["displayName", "Poland"], ["color", "197 92 106"]])],
    //["TIM", new Map([["displayName", "Timurids"], ["color", "213 0 39"]])],
    ["BYZ", new Map([["displayName", "Byzantium"], ["color", "213 0 39"]])],
]);

export function populateVariableSelect() : void {
    const variableSelect = document.getElementById("variableSelect");
    DataPointsForLineGraph.forEach((variable: string) => {
        const option = document.createElement("option");
        option.value = variable;
        // self indulgent one-liner to title case every word and replace _ with a space
        option.text = variable.split("_").map((word: string) => {
            return word.charAt(0).toUpperCase() + word.substring(1);
        }).join(" ");
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
        tagCheckbox.checked = true;
        const tagCheckboxLabel = document.createElement("label");
        tagCheckboxLabel.htmlFor = tag;
        tagCheckboxLabel.innerHTML = properties.get("displayName")
        tagOption.appendChild(tagCheckbox);
        tagOption.appendChild(tagCheckboxLabel);
        optionsBox.appendChild(tagOption);
    })
}
