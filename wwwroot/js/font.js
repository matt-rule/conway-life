function createOffscreenTexture(gl, width, height) {
    // Create a texture
    var texture = gl.createTexture();
    
    // Bind the texture so the next few commands affect it
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Define the texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Allocate memory for the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    return texture;
}

function createCharacterTextures(gl, font, size) {
    var characterTextures = {};
    var canvas2d = document.createElement('canvas');
    var ctx = canvas2d.getContext('2d');
    ctx.font = `${size}px ${font}`;

    // ASCII printable characters are in range 32-126
    for (var i = 32; i <= 126; i++) {
        var character = String.fromCharCode(i);
        var metrics = ctx.measureText(character);
        canvas2d.width = metrics.width;
        canvas2d.height = size; // adjust if necessary

        ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
        ctx.fillText(character, 0, size);

        var texture = createOffscreenTexture(gl, canvas2d.width, canvas2d.height);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

        characterTextures[character] = texture;
    }

    return characterTextures;
}

// function createQuad(positionBuffer, texCoordBuffer, x, y, width, height) {
//     // Calculate clip space coordinates
//     var x1 = x;
//     var x2 = x + width;
//     var y1 = y;
//     var y2 = y + height;

//     // Create a quad in the position buffer
//     positionBuffer.push(x1, y1);
//     positionBuffer.push(x2, y1);
//     positionBuffer.push(x1, y2);
//     positionBuffer.push(x1, y2);
//     positionBuffer.push(x2, y1);
//     positionBuffer.push(x2, y2);

//     // Create corresponding texture coordinates
//     texCoordBuffer.push(0.0, 0.0);
//     texCoordBuffer.push(1.0, 0.0);
//     texCoordBuffer.push(0.0, 1.0);
//     texCoordBuffer.push(0.0, 1.0);
//     texCoordBuffer.push(1.0, 0.0);
//     texCoordBuffer.push(1.0, 1.0);
// }

function createQuad(positions, texCoords, x, y, width, height) {
    // Scale and translate x and y into clip space coordinates
    x = 2 * x / gl.canvas.width - 1;
    y = 2 * y / gl.canvas.height - 1;
    width = 2 * width / gl.canvas.width;
    height = 2 * height / gl.canvas.height;

    // Vertices for the quad
    var vertices = [
        x, y,
        x + width, y,
        x, y + height,
        x, y + height,
        x + width, y,
        x + width, y + height
    ];
    
    // Push each vertex into the array
    for (var i = 0; i < vertices.length; i++) {
        positions.push(vertices[i]);
    }

    // Texture coordinates
    var tex = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1
    ];
    
    for (var i = 0; i < tex.length; i++) {
        texCoords.push(tex[i]);
    }
}

function renderText(gl, text, characterTextures, positionBuffer, texCoordBuffer, program) {
    // Use the program
    gl.useProgram(program);

    // Set up the position attribute
    var positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set up the texture coordinate attribute
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw a rectangle (two triangles) for each character
    gl.drawArrays(gl.TRIANGLES, 0, 6 * text.length);
}

// function renderText(gl, text, characterTextures, positionBuffer, texCoordBuffer, program) {
//     // Use the program
//     gl.useProgram(program);

//     // Set up the position attribute
//     var positionLocation = gl.getAttribLocation(program, "a_position");
//     gl.enableVertexAttribArray(positionLocation);
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

//     // Set up the texture coordinate attribute
//     var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
//     gl.enableVertexAttribArray(texCoordLocation);
//     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
//     gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

//     // Set up the texture uniform
//     var textureLocation = gl.getUniformLocation(program, "u_texture");
    
//     for (let i = 0; i < text.length; i++) {
//         let character = text[i];
//         let texture = characterTextures[character];
        
//         if (!texture) continue;

//         // Bind the texture
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         gl.uniform1i(textureLocation, 0);

//         // Draw a rectangle (two triangles) for the character
//         gl.drawArrays(gl.TRIANGLES, 0, 6);
//     }
// }

// function createTexture(gl, width, height, data) {
//     var texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);

//     // Set up texture parameters
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

//     // Upload the image data to the texture
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(data));

//     return texture;
// }

// function processFontData(err, font, canvas, gl, callback) {
//     // If error, return early
//     if (err) {
//         alert('Font could not be loaded: ' + err);
//         callback(null);
//         return; // Early return
//     }

//     var scale = 1 / font.unitsPerEm * 72;
//     var glyphs = font.stringToGlyphs('A');

//     var glyphTextures = [];

//     for (var i = 0; i < glyphs.length; i++) {
//         var glyph = glyphs[i];

//         // Create a 2D canvas to draw the glyph on
//         var canvas = document.createElement('canvas');
//         var ctx = canvas.getContext('2d');
//         canvas.width = glyph.advanceWidth;
//         canvas.height = glyph.yMax - glyph.yMin;

//         // Draw the glyph on the canvas
//         ctx.fillStyle = 'white';
//         ctx.font = canvas.width + 'px ' + font.familyName;
//         ctx.fillText(glyph.unicode, 0, -glyph.yMin);

//         // Get the image data from the canvas
//         var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//         // Create a WebGL texture from the image data
//         var texture = createTexture(gl, imageData.width, imageData.height, imageData.data);

//         // Record the texture and other glyph data
//         glyphTextures.push({
//             texture: texture,
//             width: canvas.width,
//             height: canvas.height,
//             xAdvance: glyph.advanceWidth
//         });
//     }
    
//     // ----

//     // var x = 0;
//     // var y = 0;
//     // var maxHeight = 0;
//     // var glyphTextures = [];
    
//     // for (var i = 0; i < glyphs.length; i++) {
//     //     var glyph = glyphs[i];

//     //     var metrics = glyph.getMetrics();
//     //     if(metrics.yMax == 0 && metrics.yMin == 0) {
//     //         continue;
//     //     }

//     //     // Log the rectangle position and size
//     //     console.log('Glyph:', i, 'X:', x, 'Y:', y, 'Width:', glyph.advanceWidth * scale, 'Height:', metrics.yMax * scale);

//     //     // Draw a border around the rectangle for visualization
//     //     gl.strokeRect(x, y, glyph.advanceWidth * scale, metrics.yMax * scale);

//     //     //var bitmap = gl.getImageData(x, y, glyph.advanceWidth * scale, metrics.yMax * scale);

//     //     // Render the glyph to the context
//     //     glyph.draw(gl, x, y, 72);

//     //     // Record texture coordinates
//     //     glyphTextures.push({
//     //         x: x / canvas.width,
//     //         y: y / canvas.height,
//     //         width: glyph.advanceWidth * scale / canvas.width,
//     //         height: metrics.yMax * scale / canvas.height
//     //     });

//     //     x += glyph.advanceWidth * scale;
//     //     if (metrics.yMax * scale > maxHeight) {
//     //         maxHeight = metrics.yMax * scale;
//     //     }

//     //     // Wrap to the next row if we're out of space
//     //     if (x > canvas.width) {
//     //         x = 0;
//     //         y += maxHeight;
//     //         maxHeight = 0;
//     //     }
//     // }

//     // Call the callback with the loaded data
//     renderText(gl, {
//         glyphTextures: glyphTextures,
//         atlasCanvas: canvas,
//         glyphs: glyphs,
//         unitsPerEm: font.unitsPerEm
//     });
// }

// function loadFont(url, canvas, gl) {
//     opentype.load(url, function(err, font) {
//         processFontData(err, font, canvas, gl);
//     });
// }

// function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {

//     // Helper function to create a shader
//     function createShader(gl, type, source) {
//         let shader = gl.createShader(type);
//         gl.shaderSource(shader, source);
//         gl.compileShader(shader);
//         let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
//         if (success) {
//             return shader;
//         }
        
//         console.log(gl.getShaderInfoLog(shader));
//         gl.deleteShader(shader);
//     }

//     // Create and compile the shaders
//     let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
//     let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

//     // Create a program and link the shaders
//     let program = gl.createProgram();
//     gl.attachShader(program, vertexShader);
//     gl.attachShader(program, fragmentShader);
//     gl.linkProgram(program);

//     let success = gl.getProgramParameter(program, gl.LINK_STATUS);
//     if (success) {
//         return program;
//     }
    
//     // Shader program failure
//     var x = gl.getProgramInfoLog(program);
//     console.log(typeof(x));
//     console.log(x);
//     gl.deleteProgram(program);
// }

// function makeFontShaderProgram()
// {
//     // Define the shader program
//     var vertexShaderSource = `
//         attribute vec2 a_position;
//         attribute vec2 a_texCoord;
//         uniform vec2 u_resolution;
//         varying vec2 v_texCoord;
//         void main() {
//             vec2 zeroToOne = a_position / u_resolution;
//             vec2 zeroToTwo = zeroToOne * 2.0;
//             vec2 clipSpace = zeroToTwo - 1.0;
//             gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
//             v_texCoord = a_texCoord;
//         }
//     `;
//     var fragmentShaderSource = `
//         precision mediump float;
//         uniform sampler2D u_image;
//         varying vec2 v_texCoord;
//         void main() {
//             gl_FragColor = texture2D(u_image, v_texCoord);
//         }
//     `;

//     // Compile the shader program
//     return createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
// }

// function renderText(gl, data) {

//     gl.clearColor(0, 0, 0, 1);  // Clear to black
//     //gl.clear(gl.COLOR_BUFFER_BIT);

//     // Step 3: Create the texture
//     var texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.atlasCanvas);
//     gl.generateMipmap(gl.TEXTURE_2D);
    
//     var shaderProgram = makeFontShaderProgram();
//     gl.useProgram(shaderProgram);
    
//     // Define the positions for the glyphs
//     var positions = [];
//     var texCoords = [];

//     //console.log ('canvas width:', gl.canvas.width);
//     //console.log ('canvas height:', gl.canvas.height);
//     var x = 20;
//     var y = 20;

//     // Determine a scaling factor. This depends on the desired size of your text.
//     // Smaller values will make the text larger, and larger values will make the text smaller.
//     // var scaleFactor = font.unitsPerEm / 32; // Adjust the denominator to your needs
//     var scaleFactor = data.unitsPerEm / 32;

//     for (var i = 0; i < data.glyphs.length; i++) {
//         if ( !data.glyphTextures[i] )
//             continue;

//         var glyph = data.glyphs[i];
//         var tex = data.glyphTextures[i];

//         // Add positions for the quad
//         positions.push(
//             x, y,
//             x + glyph.advanceWidth / scaleFactor, y,
//             x + glyph.advanceWidth / scaleFactor, y + glyph.yMax / scaleFactor,
//             x, y + glyph.yMax / scaleFactor
//         );

//         console.log('tex', tex);
        
//         // Add texture coordinates for the quad
//         texCoords.push(
//             tex.x, tex.y,
//             tex.x + tex.width, tex.y,
//             tex.x + tex.width, tex.y + tex.height,
//             tex.x, tex.y + tex.height
//         );

//         x += glyph.advanceWidth / scaleFactor;
//     }

//     //console.log('testing', texCoords);
    
//     // Create buffers for the positions and texture coordinates
//     var positionBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

//     var texCoordBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    
//     // Get locations of attributes and uniforms
//     var positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
//     var texCoordLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');
//     var resolutionLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
//     var imageLocation = gl.getUniformLocation(shaderProgram, 'u_image');
    
//     // Enable the attributes
//     gl.enableVertexAttribArray(positionLocation);
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
//     gl.enableVertexAttribArray(texCoordLocation);
//     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
//     gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

//     // Read back data from the buffer
//     var dataFromBuffer = new Float32Array(positions.length);
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//     gl.getBufferSubData(gl.ARRAY_BUFFER, 0, dataFromBuffer);

//     // Log the data
//     //console.log('Data from position buffer: ', dataFromBuffer);

//     // Read back data from the buffer
//     dataFromBuffer = new Float32Array(texCoords.length);
//     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
//     gl.getBufferSubData(gl.ARRAY_BUFFER, 0, dataFromBuffer);

//     // Log the data
//     //console.log('Data from tex buffer: ', dataFromBuffer);

//     // Set the uniforms
//     gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
//     //gl.uniform2f(resolutionLocation, gl.canvas.width / scaleFactor, gl.canvas.height / scaleFactor);
//     gl.uniform1i(imageLocation, 0);

//     // // Step 4: Draw the text
//     // gl.drawArrays(gl.TRIANGLE_FAN, 0, data.glyphs.length * 4);
// }
