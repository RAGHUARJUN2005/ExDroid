/*
	NAME: ExDroid

	DESCRIPTION: Saves each layer in the active document to a PNG in all Android relevant resolutions.

	AUTHORS: Johannes Walter, Philipp Paul, Peter Amende

	REQUIRES: Adobe Photoshop CS2 or higher

	Forked from Johannes Walter: https://github.com/jwa107/Photoshop-Export-Layers-as-Images
*/


// enable double-clicking from Finder/Explorer (CS2 and higher)
#target photoshop
app.bringToFront();

function main() {

	var resolutions = {
		ldpi: 0.75,
		mdpi: 1,
		hdpi: 1.5,
		xhdpi: 2,
		xxhdpi: 3
	};
	
    // two quick checks
	if(!okDocument()) {
        alert("Document must be saved and be a layered PSD.");
        return;
    }

    var len = activeDocument.layers.length;
    var ok = confirm("Note: Your Document has to be mdpi!");
    if(!ok) return

    // user preferences
    prefs = new Object();
    prefs.fileType = "PNG";
    prefs.fileQuality = 24;
    prefs.filePath = app.activeDocument.path;
    prefs.count = 0;

    //instantiate dialogue
    for(var resolution in resolutions) {
    	resize(activeDocument, resolutions[resolution]);
	    hideLayers(activeDocument);
	    
	    var myFolder = new Folder(prefs.filePath + "/drawable-"+resolution+"/");
		if(!myFolder.exists) myFolder.create();
		saveLayers(activeDocument, resolution);
    	restore(activeDocument, resolutions[resolution]);
    }
	toggleVisibility(activeDocument);
    
    alert("Saved " + prefs.count + " files.");
}

function resize(ref, factor) {
	var resizedWidth = ref.width * factor;
	var resizedHeight = ref.height * factor;
	
	ref.resizeImage (resizedWidth, resizedHeight);
}

function restore(ref, factor) {
	var resizedWidth = ref.width * (1/factor);
	var resizedHeight = ref.height * (1/factor);
	
	ref.resizeImage (resizedWidth, resizedHeight);
}

function hideLayers(ref) {
    var len = ref.layers.length;
    for (var i = 0; i < len; i++) {
        var layer = ref.layers[i];
        if (layer.typename == 'LayerSet') hideLayers(layer);
        else layer.visible = false;
    }
}

function toggleVisibility(ref) {
    var len = ref.layers.length;
    for (var i = 0; i < len; i++) {	
        layer = ref.layers[i];
        layer.visible = !layer.visible;
    }
}

function saveLayers(ref, res) {
    var len = ref.layers.length;
    // rename layers top to bottom
    for (var i = 0; i < len; i++) {
        var layer = ref.layers[i];
        if (layer.typename == 'LayerSet') {
            // recurse if current layer is a group
            hideLayers(layer);
            saveLayers(layer, res);
        } else {
            // otherwise make sure the layer is visible and save it
            layer.visible = true;
            saveImage(layer.name, res);
            layer.visible = false;
        }
    }
}

function saveImage(layerName, res) {
    var handle = getUniqueName(prefs.filePath + "/drawable-" + res + "/" + layerName);
    prefs.count++;
    SavePNG24(handle);
}

function getUniqueName(fileroot) { 
    // form a full file name
    // if the file name exists, a numeric suffix will be added to disambiguate
	
    var filename = fileroot;
    for (var i=1; i<100; i++) {
        var handle = File(filename + "." + prefs.fileType); 
        if(handle.exists) {
            filename = fileroot + "-" + padder(i, 3);
        } else {
            return handle; 
        }
    }
} 

function padder(input, padLength) {
    // pad the input with zeroes up to indicated length
    var result = (new Array(padLength + 1 - input.toString().length)).join('0') + input;
    return result;
}

function SavePNG8(saveFile) { 
    exportOptionsSaveForWeb = new ExportOptionsSaveForWeb();
    exportOptionsSaveForWeb.format = SaveDocumentType.PNG
    exportOptionsSaveForWeb.dither = Dither.NONE;
    activeDocument.exportDocument( saveFile, ExportType.SAVEFORWEB, exportOptionsSaveForWeb );
} 

function SavePNG24(saveFile) { 
    pngSaveOptions = new PNGSaveOptions(); 
    activeDocument.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE); 
} 

function SaveJPEG(saveFile) { 
    jpegSaveOptions = new JPEGSaveOptions(); 
    jpegSaveOptions.quality = prefs.fileQuality;
    activeDocument.saveAs(saveFile, jpegSaveOptions, true, Extension.LOWERCASE); 
} 

function okDocument() {
     // check that we have a valid document
     
    if (!documents.length) return false;

    var thisDoc = app.activeDocument; 
    var fileExt = decodeURI(thisDoc.name).replace(/^.*\./,''); 
    return fileExt.toLowerCase() == 'psd'
}

function wrapper() {
    function showError(err) {
        alert(err + ': on line ' + err.line, 'Script Error', true);
    }

    try {
        // suspend history for CS3 or higher
        if (parseInt(version, 10) >= 10) {
            activeDocument.suspendHistory('Save Layers', 'main()');
        } else {
            main();
        }
    } catch(e) {
        // report errors unless the user cancelled
        if (e.number != 8007) showError(e);
    }
}

wrapper();
