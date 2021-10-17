clue.plot2 = async function(data, scoreMin, scoreMax, title) {
    $('.plot2-visual').html('');
    $('.plot2-title').html('');
    const constructTitle = [];
    if (!title.hasDRC) {
        const note ="Note: We were unable to fit a curve to the data for this cell line."
        constructTitle.push('<h6 style="text-align:left;font-weight: bold;color:red;">' + note + '</h6>');
    }
    //constructTitle.push('<h2 style="text-align:left;font-weight: bold;">' + title.pertname + '</h2>');
    constructTitle.push('<h3 style="text-align:left;font-weight: bold;">' + title .ccle_name + '-' + title.culture + '</h3>');
    constructTitle.push('<h4 style="text-align:left;font-weight: bold;">AUC:');
    if(title.auc && title.auc.length > 0){
        for(let index=0; index < title.auc.length; index++){
            const auc = title.auc[index];
            constructTitle.push('<font color="' + auc.color + '">' + auc.auc + '&nbsp;</font>');
        }

    }else{
        constructTitle.push('N/A');
    }
    constructTitle.push('</h4>');

    constructTitle.push('<h4 style="text-align:left;font-weight: bold;">IC50:');
    if(title.ic50 && title.ic50.length > 0){
        for(let index=0; index < title.ic50.length; index++){
            const ic50 = title.ic50[index];
            constructTitle.push('<font color="' + ic50.color + '">' + ic50.ic50 + '&nbsp;</font>');

        }

    }else{
        constructTitle.push('N/A');
    }
    constructTitle.push('</h4>');


    $('.plot2-title').html(constructTitle.join(''));

    const layout = {
        xaxis: {
            // range: [-1, 5],
            zeroline: false,
            dtick : 1,
            title: {
                text: '<b>log2(Dose) (uM)</b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: 'black'
                }
            },
            //type: 'log',
           // autorange: true
        },
        yaxis: {
            range: [(scoreMin-0.5), (scoreMax+0.5)],
            zeroline: false,
            title: {
                text: '<b>2^viability_LFC.cb</b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: 'black'
                }
            }
        },
        legend: {
            title: {
                text: '<b></b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 18,
                    color: 'black'
                }
            }
        },
        hovermode: "closest",
    };
    const config = {
        modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
        displaylogo: false
    };
    Plotly.newPlot('plot2-visual', data, layout,config);

    function stringDivider(str, width, spaceReplacer) {
        if (str.length>width) {
            var p=width
            for (;p>0 && str[p]!=' ';p--) {
            }
            if (p>0) {
                var left = str.substring(0, p);
                var right = str.substring(p+1);
                return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
            }
        }
        return str;
    }
};
