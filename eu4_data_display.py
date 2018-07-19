import zipfile, os, datetime, time, json
from ipywidgets import widgets, interactive
import pandas as pd
import numpy as np
import plotly.plotly as py
import plotly.graph_objs as go



save_dir = r""
dfs = []
years = []
data_options = ["treasury", "score", "estimated_monthly_income",
                "manpower", "num_of_regulars", "Army Cost",
                "Navy Cost", "prestige", "raw_development"]
tags = ["FRA", "ENG", "CAS", "POR", "TUR", "HAB", "MOR", "MOS", "POL", "SPA"]
data = {}
for tag in tags:
    data[tag] = {}
    for option in data_options:
        data[tag][option] = []


os.chdir(save_dir)

for filename in os.listdir():
    if("France" in filename):
        df = pd.read_csv(filename, '\t')
        df.set_index(['country'])
        dfs.append(df)
        year_temp = filename.split('_')
        years.append(float(str(float(year_temp[1][:4])+(float(year_temp[1][5])/12))[:6]))
for df in dfs:
    for index, row in df.iterrows():
        if (row['country'] in tags):
            for option in data_options:
                data[row['country']][option].append((row[option]))
print(data['CAS'][option])
for option in data_options:
    for entry in data['SPA'][option]:  
        data['CAS'][option].append(entry)
#del data['SPA']
print (dfs[0].index.values)
print(years)
print(data['CAS'][option])

lines = {}
for option in data_options:
    lines[option] = []
for option in data_options:
    for tag in tags:
        temp_line =go.Scatter(
            x = years,
            y = data[tag][option],
            name = tag,
            visible=False,
            )
        lines[option].append(temp_line)
buttons_temp = []
vis = {}
i = 0
for option in data_options:
    vis[option] = []
    start = i* len(tags)
    i+=1
    for j in range(len(tags)*len(data_options)):
        if (j>=start and j<start+len(tags)):
            vis[option].append(True)
        else:
            vis[option].append(False)

for option in data_options:
    dict_temp = dict(label = option,
                     method = 'update',
                     args = [{'visible': vis[option]},
                             {'title' : option}])
    buttons_temp.append(dict_temp)
         
updatemenus = list([
    dict(type="buttons",
         active=0,
         buttons=buttons_temp,
    )
])
def getData(lines):
    temp_lst = []
    for option in lines:
        for line in lines[option]:
            temp_lst.append(line)
    return temp_lst
    
layout = dict(title='', showlegend=False,
              updatemenus=updatemenus)

fig = dict(data=getData(lines), layout=layout)
py.iplot(fig, filename='eu4')    

