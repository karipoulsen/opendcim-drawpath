<h1>DRAWPATH - openDCIM 4.3.1 cable path extension</h1>
<p>This package extends openDCIM functionality so it can display cable paths on drawings, including network installation endpoints for client computers.</p>
<p>Have a look at <a href="www.openDCIM.org">openDCIM</a></p>
<p>I can be found here: <a href="mailto:kpo@kvf.fo">kpo@kvf.fo</a></p>
<p>version 1.0</p>
<p>We use openDCIM and this extension at our facilitites - the National Broadcaster of the Faroe Islands (kvf.fo)<br>
	Basically, we use it to document and maintain our complete cabling infrastructure: network, audio and video </p>
<p>This package requires just one simple modification in one file in openDCIM. The system plugs into openDCIM on the client side.(javascript and jquery) </p>
<p>We haven't tested the 4.4 and 4.2 releases yet, but we expect no major issues.</p>
<p>These are the files:</p>
<ul>
	<li><strong>README.html</strong> This file.</li>
	<li><strong>dpcore.php</strong> Base server logic, and a few global settings.</li>
	<li><strong>drawpath.php</strong> Serves AJAX requests from the client.</li>
	<li><strong>drawpath.js</strong> Javascript to be included in some openDCIM pages.</li>
	<li><strong>dpeditor.php</strong>The layout editor.</li>
</ul>
<h3>Features</h3>
<ul>
	<li>Display cabling info on Data Center images, together with cabinet placements and other info.</li>
	<li>Render cable paths on several container images.</li>
	<li>Built-in cable layout editor.</li>
	<li>Custom coloring and rendering per cable bundle.</li>
	<li>Very simple installation.</li>
	<li>Minimal openDCIM intrusion - <em>should</em> be easy to follow upgrade cycle.</li>
	<li>Relies on openDCIM functionality, using custom attributes to store it's data.</li>
	<li>No extra tables, only a few entries in the config table.</li>
	<li>Easy to remove.</li>
</ul>
<h3>Installation</h3>
<em>Note: The installation assumes a 'standard' openDCIM installation, such as default directory names for scripts, drawings and such.
You may need to update these references manually if they are different.</em>
<ul>
	<li>Copy the package contents into a new directory directly in the main openDCIM installation directory, <strong>drawpath</strong>
       	is the default directory name.</li>
	<li>Create a new custom attribute for devices.</li>
	<li>Enable this attribute for the device templates you want, remember to update corresponding devices.</li>
	<li>Modify the <strong>header.inc.php</strong>: Insert a new line<pre>
&lt;script type="text/javascript" src="drawpath/drawpath.js"&gt;&lt;/script&gt;</pre>
	just before the first &lt;div&gt;. The last part of the file should look like:<pre>
echo '
&lt;script type="text/javascript" src="drawpath/drawpath.js"&gt;&lt;/script&gt;
&lt;div id="header"&gt;
	&lt;span id="header1"&gt;',$header,'&lt;/span&gt;
	&lt;span id="header2"&gt;',$subheader,'&lt;/span&gt;
	&lt;span id="version"&gt;',$person-&gt;UserID,'/',$version,'&lt;/span&gt;
&lt;/div&gt;
';
</pre>
	<em>Alternativeliy, if you don't like the drawpath stuff to be incluced in every page, you could just modify a few files directly: Include the script reference in the
	<ul>
		<li>configuration.php</li>
		<li>dc_stats.php</li>
		<li>container_stats.php</li>
		<li>devices.php</li>
	</ul> files in the header section instead of modifying header.inc.php.</em>
	</li>
	<li>If you've used a different installation directory name, you must modify the corresponding variables in <strong>drawpath.js</strong>
	These are all located at the top of the file. While you're there you also might want to modify caption strings and other settings.</li>
	<li>Crank up openDCIM, go to the configuration page. There should now be a tab called 'DrawPath'.
	<ul>
		<li>Select the custom attribute to use for DrawPath</li>
		<li>Define a set of custom colors to use. A few are pre-installed - modify or delete.</li>
	</ul>
	<li>You're good to go. Go to a device for which you'd like to add a path.. click the 'Edit Path..' button next to the selected custom attribute.<br>
		Please have a look at the Editor section below..
	</li>
	</ul>
<p><em>Note: On a Windows installation, you might have to change some parameters to backslash for file-related functions in <strong>dpcore.php</strong> .. <em></p>

<h3>Uninstall</h3>
<p>Basically the reverse of the installation:</p>
<ul>
	<li>Remove the <pre>&lt;script type="text/javascript" src="drawpath/drawpath.js"&gt;&lt;/script&gt;</pre>
	in <strong>header.inc.php</strong> (or the files mentioned under installation if you opted for that installation alternative).</li>
	<li>Delete the installation directory.</li>
	<li>Possibly, remove the custom attribute.</li>
	<li>Delete the entries in the configuration page.<br />
	<em>Note: Some of the DrawPath settings in the fac_Config table have to be deleted from SQL. All entries that
		relate to DrawPath start with a <strong>DP..</strong> prefix. <br />You could just leave them.. they don't interfere with
	the rest.</em>
	</li>
</ul>
<h3>Operation</h3>
<p>The concept is that network installation endpoints are defined as patch-panel devices in openDCIM.
Since devices are meant to be installed in cabinets that are located in datacenters we have to make a datacenter with a cabinet to hold the devices.
While not very elegant, we still get to use openDCIM connection facilitities as well as the patching diagrams.</p>
<p>The usual way is to define a 'virtual' datacenter and have a cabinet for each main section to describe, such as a building, or a floor layout of a building</p>

<p>Usually, network entpoints are grouped in sets of two or more ports, so we define a patch panel for each bundle, with appropriate number of<br>
ports that can be connected the usual way.</p>

<p>The devices that are to have cable paths attached to them must have a custom attribute defined - the one defined in installation.</p>

<p>'Regular' patch panels can also have cable paths attached, just enable the custom attribute for those you want.</p>
<p>Select a patch panel for editing in openDCIM, and now there should be an 'Edit' button attached to the custom attribute.
Click and define your paths. Remember to update the device.</p>
<h3>The Path Editor</h3>
<p>When on the editing page of a device, press the 'Edit Path' button next to the configured custom attrbiute. This brings up the Editor Dialog.<p>
<p>At the top you have a status bar of sorts, listing all drawings that are attached to this device, a color selector, and a button to activate the Drawing Dialog.</p>
<p>The first drawing in the list is always the master, i.e. the base drawing to define the cable path. Clicking on individual drawings brings the corresponding image on
display.</p>

<h4>Defining a path - when the master drawing is selected</h4>

<ul><li>Shift-click on the image to add a point. Points are always added to the end of the path. The first point is always the location of the device, 
	i.e. always work from the position of the device towards the main patch panel.</li>
	<li>Ctrl-click on a path point to delete it.</li>
	<li>The blue-ish rectangle defines the extent of the whole path, i.e. it encloses all the points.<br>
	You can drag the rectangle around.</li>
	<li>The red dot on the lower-right corner of the rectangle is a resize handle.</li>
</ul>
<h4>Defining a path - when any other drawing is selected</h4>
	<ul><li>Note that the individual point handles are not available here.. point editing is done on the master drawing only.</li>
	<li>Drag the rectangle to the position you want.</li>
	<li>Resize as needed.</li>
</ul>
<em>Note that the resize handle differs from the master and the rest: when moving the handle, the path itself is resized, while on the other drawings, the path is scaled, and always with the same aspect ratio - it only responds to left-right movements.</em>

<h4>The Drawings Dialog</h4>
<p>When activated for the first time on a device, and additional dialog shows up, prompting you to select one or more drawing to place the device path on.</p>
<p><em>This dialog lists all drawings for DataCenters and Containers. Any/all of these can have device paths attached to them.</em></p>
<p><strong>Select a master</strong>. Each device path must have a master drawing where the actual path layout is defined. 
All other drawings that you have selected for this device use the same path, withi adjustments for offset and scale.</p>

<p><strong>This means: All drawings for a given device are assumed to have the same orientation, and all drawings should have the same aspect ratio.</strong></p>

<p>Once you're done, press the OK button on the main dialog. This closes the dialog, and inserts the path parameters into the custom attibute for this device.</p>

<p><strong>Important:</strong>You still have to save the changes made to the device with the 'update' button on the device edit page!!.</p>

<p><em>Hint: Use the custom attribute as any other field, such as copying paths to other devices, etc.</em></p>
	
<h3>Troubleshooting</h3>
<p>We've only tested this with Chrome and Firefox. Can't be bothered with some old IE version.</p>
<p>If something breaks, or appears weird, always look first in the console window of the browser. openDCIM generates plenty of errors of its own,
so you have to look around for a bit.</p>

<p>The extension revolves around JS client-side logic, and chains to the openDCIM DOM. Problems might arise if updates in openDCIM alter 
css classes and/or DOM hierarchy. Errors of this sort should all originate from <strong>drawpath.js</strong>. Have a look and modify.</p>

<p>Contact us if you're not up to have a look yourself.</p>
<p>And, by the way, please drop us a note if you find some problem, workarounds, suggestions, etc.</p>
