import zipfile, os, datetime, time, json, re
import pandas as pd


zip_path = r""
extract_dir = r""
gamestate_path = r""
meta_path = r""

with open(r"", 'r') as file:
	all_country_tag = json.loads(file.read())

#Countries tags to search for
#country_tag = ["FRA", "GBR", "TUR" , "MAM", "SPA", "MNG", "DLH", "MOS", "MOR", "PLC", "HAB", "CAS", "POR", "DAN", "SWE", "ARA", "TUN", "BAH", "POL", "RUS", "BRA", "PRU", "GER", "ENG", "BOH", "BUR", "NED", "NAP", "PAP" "VEN", "GEN", "JAP", "JNP", "VIJ",
               #"BEN", "ORI", "MAL", "AYU", "KRC", "MJZ", "KOR", "AZT", "ZAN", "SCO", "HAM", "GEL", "ETH", "SDY", "UES", "ROM"]
country_tag = ['FRA', 'GBR', 'TUR', 'MAM', 'SPA', 'MNG', 'DLH', 'MOS', 'MOR', 'PLC', 'HAB', 'CAS',
               'POR', 'DAN', 'SWE', 'ARA', 'TUN', 'BAH', 'POL', 'RUS', 'BRA', 'PRU', 'GER', 'ENG',
               'BOH', 'BUR', 'NED', 'NAP', 'PAP', 'VEN', 'GEN', 'JAP', 'JNP', 'VIJ', 'BEN', 'ORI',
               'MAL', 'AYU', 'KRC', 'MJZ', 'KOR', 'AZT', 'ZAN', 'SCO', 'HAM', 'GEL', 'ETH', 'SDY',
               'UES', 'ROM', 'BAV', 'SIL', 'HUN', 'LIT', 'BOS', 'SER', 'SAV', 'SWI', 'HES', 'SAX',
               'TEU', 'POM', 'MKL', 'BRU', 'TRI', 'LIE', 'MUN', 'ALS', 'PAL', 'WBG', 'OLD', 'LAU',
               'HSA', 'NUM', 'RVA', 'ULM', 'MEM', 'AUG', 'LOR', 'PRO', 'AAC', 'ANH', 'ANS', 'BAD',
               'BRE', 'EFR', 'FRN', 'HAN', 'HLR', 'KLE', 'KOL', 'LUN', 'MAG', 'MAI', 'MEI', 'MVA',
               'SLZ', 'STY', 'THU', 'TIR', 'WES', 'WUR', 'VER', 'NSA', 'DTT', 'TIM', 'PER', 'MUG'
               'SCA', 'NOG', 'KAZ', 'OIR', 'CHG', 'SHY', 'GLH', 'GOL', 'MGE', 'ORM', 'BYZ', 'QAR']
#variables in standard format to collect
data_collect = ["human", "government_rank", "national_focus", "technology_cost", "capital", "trade_port", "base_tax", "raw_development", "religion",
                "adm_tech", "dip_tech", "mil_tech", "is_at_war", "current_power_projection", "great_power_score" , "navy_strength", "total_war_worth", "num_of_rebel_controlled_provinces",
                "num_of_rebel_armies", "num_owned_home_cores", "non_overseas_developmen", "num_of_controlled_cities", "num_of_total_ports", "num_of_mercenaries", "num_of_regulars", "num_of_cities",
                "forts", "num_of_colonies", "num_of_allies", "num_of_royal_marriages", "num_of_subjects", "num_of_heathen_provs", "average_unrest" , "average_autonomy", "score" , "prestige",
                "stability", "treasury", "estimated_monthly_income", "land_maintenance", "naval_maintenance", "colonial_maintenance", "missionary_maintenance",
                "army_tradition", "navy_tradition", "lastmonthincome", "lastmonthexpense", "loan_size", "estimated_loan", "religious_unity", "republican_tradition", "meritocracy", "corruption",
                "root_out_corruption_slider" "legitimacy", "mercantilism", "splendor", "absolutism", "army_professionalism", "manpower", "max_manpower", "max_sailors",
                "wants_to_be_great_power", "needs_regiments", "needs_buildings", "needs_ships"]
#variables stored in specific data formats
misc_collect_search = ["lastmonthincometable", "lastmonthexpensetable", "active_idea_groups", "monarch"]
#structures for variables in specific data formats
income_data_collect = ["Taxation", "Production", "Trade", "Gold", "Tariffs", "Vassals", "Harbor Fees", "Subsidies In", "Spoils of War", "War Rep In", "Condottieri", "Knowledge Sharing"]
expense_data_collect = ["Advisor", "Interest", "State", "MYSTERY", "Subsidies Out", "War Rep OUT", "Army Cost", "Navy Cost", "Fort Cost", "Colonies", "Missionaries"]
idea_data_collect = ["National Ideas", "Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5", "Idea 6", "Idea 7", "Idea 8"]
statinfo = os.stat(zip_path)
while(True):
    print("checking gamestate...")
    statinfo_new = os.stat(zip_path)
    if(statinfo_new.st_mtime > statinfo.st_mtime):
        statinfo = statinfo_new
        print(datetime.datetime.fromtimestamp(statinfo.st_mtime))
        start_time = time.time()
        #formats game_info dict with selected data points
        game_info = {'country':[]}
        for data in data_collect:
            game_info[data] = []
        for data in income_data_collect:
            game_info[data] = []
        for data in expense_data_collect:
            game_info[data] = []
        for data in idea_data_collect:
            game_info[data] = []

        #extracts current autosave
        zip_ref = zipfile.ZipFile(zip_path, 'r')
        zip_ref.extractall(extract_dir)
        zip_ref.close()
        
        

        # access "gamestate" and "meta" files from uncompressed .eu4 save file
        file = open(gamestate_path, 'r')
        gs = file.read()
        file.close()
        file = open(meta_path, 'r')
        meta = file.read()
        file.close()

        # collects host country name and date for .csv file
        begin = meta.find("date")
        begin = (meta.find('=', begin))+1
        end = meta.find('\n', begin)
        game_date = meta[begin:end]
        begin = meta.find("player")
        begin = (meta.find("=", begin))+2
        end = meta.find('\n', begin)
        player_tag = meta[begin:end]
        player_tag = player_tag[:-1]
        if player_tag not in country_tag:
            country_tag.append(player_tag)
        begin = meta.find("displayed_country_name")
        begin = (meta.find('=', begin))+2
        end = meta.find('\n', begin)
        dis_name = meta[begin:end]
        dis_name = dis_name[:-1]
        export_name = r"" + dis_name + '_' + game_date + ".csv"

        for tag in country_tag:
            # checks to see if country tag exists in current game
            if(gs.find(tag + "={\n\t\thas") == -1 and gs.find(tag + "={\n\t\thuman=yes") == -1):
                print(tag + " does not exist")
            else:    
                #adds country tag and creates variable for relevent country data
                print("Country: " + tag)
                game_info['country'].append(tag)
                nation_start = gs.find(tag + "={\n\t\thas")
                if(nation_start == -1):
                    nation_start = gs.find(tag + "={\n\t\thuman=yes")
                nation_end = gs.find("mission_slot={",nation_start)
                nation = gs[nation_start:nation_end]

                #stores available data that is most simply formatted in gamestate
                #example: government_rank=3
                for data in data_collect:
                    if (data == "score"):
                        begin = nation.find('\t'+data, prev)
                    else:
                        begin = nation.find('\t'+data)
                    if (begin == -1):
                        if(data[:3] == "num"):
                            game_info[data].append("0")
                        else:
                            game_info[data].append("N/A")
                    else:
                        begin = (nation.find('=', begin))+1
                        end = nation.find('\n', begin)
                        game_info[data].append(nation[begin:end])
                        prev = begin

                #extracts and stores data from individual formats
                #exaple: lastmonthincome={\n\t\t\t10 40 0 40 ...
                for data in misc_collect_search:

                    #Extracts income data from ' ' delimited list
                    if (data == "lastmonthincometable"):
                        begin = nation.find(data)
                        if (begin == -1):
                            for income_data in income_data_collect:
                                game_info[income_data].append("ELIMINATED")     #if any of this data is blank we know the tag has been fully annexed
                        else:
                            begin = (nation.find("\t", begin))+4
                            end = nation.find("\n", begin)
                            income = nation[begin:end]
                            income = income.split(' ')
                            i = 0
                            for income_data in income_data_collect:
                                game_info[income_data].append(income[i])
                                i+=1

                    #extracts expense data from ' ' delimited list
                    if (data == "lastmonthexpensetable"):
                        begin = nation.find(data)
                        if (begin == -1):
                            for expense_data in expense_data_collect:
                                game_info[expense_data].append("ELIMINATED")    
                        else:
                            begin = (nation.find('\t', begin))+4
                            end = nation.find('\n', begin)
                            expense = nation[begin:end]
                            expense = expense.split(" ")
                            i = 0
                            for expense_data in expense_data_collect:
                                game_info[expense_data].append(expense[i])
                                i+=1
                    #extracts name of each idea group and the current level
                    if (data == "active_idea_groups"):
                        begin = nation.find(data)
                        begin = (nation.find('\t', begin))
                        end = nation.find("}", begin)
                        ideas = nation[begin:end]
                        ideas = ideas.split('\n')
                        i = 0
                        for idea in ideas:
                            ideas[i] = idea[3:]
                            i+=1
                        j = 0
                        for idea in idea_data_collect:
                            if(j < (i-1)):
                                temp_idea = ideas[j].split('_')
                                temp_idea=temp_idea[0] + ": " + temp_idea[-1][-1]
                                game_info[idea].append(temp_idea)
                            else:
                                game_info[idea].append("NONE")
                            j+=1

                    if (data == "monarch"):
                        begin = nation.find("\n\t\tmonarch={")+12
                        begin = (nation.find('=', begin))+1
                        end = nation.find('\n', begin)
                        monarch_id = nation[begin:end]
                        
                    
            print("\n\n\n\n\n----------------------END COUNTRY -----------------------\n\n\n\n\n\n")
        print(dis_name + "_" + game_date)
        df = pd.DataFrame(game_info)
        print(df)
        df.to_csv(export_name, sep='\t')
        print("--- %s seconds ---" % (time.time() - start_time))
    time.sleep(10)
    
