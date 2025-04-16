// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var mvp = MatrixMult( projectionMatrix, trans);
	var c = Math.cos(rotationX)
	var s = Math.sin(rotationX)
	var rotatex_trans = [
		1, 0, 0, 0,
		0, c, s, 0,
		0, -s, c, 0,
		0, 0, 0, 1
	]
	var mvp2 = MatrixMult(mvp, rotatex_trans)
	var c2 = Math.cos(rotationY)
	var s2 = Math.sin(rotationY)
	var rotatey_trans = [
		c2, 0, -s2, 0,
		0, 1, 0, 0,
		s2, 0, c2, 0,
		0, 0, 0, 1
	]
	var mvp3 = MatrixMult(mvp2, rotatey_trans)
	return mvp3;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.numTriangles = 0;
		const vertexShaderSource = `
			attribute vec3 vertPos;
			attribute vec2 texCoords;

			uniform mat4 mvp;
			varying vec2 vTexCoords;
			uniform bool swapAxes;
			void main(void){
				vec3 position = vertPos;
				if (swapAxes) {
					position = vec3(position.x, position.z, position.y);
				}
				gl_Position = mvp * vec4(position, 1.0);
				vTexCoords = texCoords;

				
			}
			`;

		const fragmentShaderSource = `
			precision mediump float;
			uniform sampler2D textureImage;
			uniform bool useTexture;

			varying vec2 vTexCoords;

			void main(void) {
				if (useTexture)
					gl_FragColor = texture2D(textureImage, vTexCoords);
				else
					gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);
			}
		`;	

		this.program = InitShaderProgram( vertexShaderSource, fragmentShaderSource);
		this.vertPos = gl.getAttribLocation( this.program, 'vertPos');
		this.mvp = gl.getUniformLocation( this.program, 'mvp');
		this.texCoords = gl.getAttribLocation(this.program, 'texCoords');
		this.swapAxes = gl.getUniformLocation(this.program, 'swapAxes');
		this._swap_axes = false;

		this.textureImage = gl.getUniformLocation(this.program, 'textureImage');
		this.useTexture = gl.getUniformLocation(this.program, 'useTexture');

		this.texbuffer = gl.createBuffer();
		this.texture = gl.createTexture();
		this.vertbuffer = gl.createBuffer();
		this._use_texture = false;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		gl.useProgram(this.program)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		this._swap_axes = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		gl.useProgram( this.program );
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.vertexAttribPointer(this.texCoords, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoords);


		gl.uniform1i(this.useTexture, this._use_texture);
		gl.uniform1i(this.swapAxes, this._swap_axes);


		if (this._use_texture) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(this.textureImage, 0); 
		}
	
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.useProgram(this.program);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		this._use_texture = true;

	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		this._use_texture = show;
	}
	
}
