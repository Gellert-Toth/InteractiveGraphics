function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var c = Math.cos(rotationX)
	var s = Math.sin(rotationX)
	var rotatex_trans = [
		1, 0, 0, 0,
		0, c, s, 0,
		0, -s, c, 0,
		0, 0, 0, 1
	]
	var mvp = MatrixMult(trans, rotatex_trans)
	var c2 = Math.cos(rotationY)
	var s2 = Math.sin(rotationY)
	var rotatey_trans = [
		c2, 0, -s2, 0,
		0, 1, 0, 0,
		s2, 0, c2, 0,
		0, 0, 0, 1
	]
	mvp = MatrixMult(mvp, rotatey_trans)
	return mvp;
}

class MeshDrawer
{
	constructor()
	{
		this.numTriangles = 0;
		const vertexShaderSource = `
			attribute vec3 vertPos;
			attribute vec2 texCoords;
			attribute vec3 normals;

			uniform mat4 mvp;
			uniform mat4 mv;
			uniform mat3 normalMatrix;


			uniform bool swapAxes;

			varying vec2 vTexCoords;
			varying vec3 vNormal;
			varying vec3 vEyePos;

			void main(void){
				vec3 position = vertPos;
				if (swapAxes) {
					position = vec3(position.x, position.z, position.y);
				}
				
				vec4 eyePos = mv * vec4(position, 1.0);
				vEyePos = eyePos.xyz;
				vNormal = normalMatrix * normals;

				vTexCoords = texCoords;
				gl_Position = mvp * vec4(position, 1.0);
			}
			`;

		const fragmentShaderSource = `
			precision mediump float;
			uniform sampler2D textureImage;
			uniform bool useTexture;
			uniform vec3 lightDir;   
			uniform float shininess;

			varying vec2 vTexCoords;
			varying vec3 vNormal;
			varying vec3 vEyePos;

			void main(void) {
				vec3 N = normalize(vNormal);          
				vec3 L = normalize(lightDir);        
				vec3 V = normalize(-vEyePos);         
				vec3 H = normalize(L + V);            

				float diff = max(dot(N, L), 0.0);             
				float spec = pow(max(dot(N, H), 0.0), shininess);

				vec3 baseColor = useTexture ? texture2D(textureImage, vTexCoords).rgb : vec3(1.0);
				vec3 diffuse = diff * baseColor;
				vec3 specular = spec * vec3(1.0);

				vec3 finalColor = diffuse + specular;
				gl_FragColor = vec4(finalColor, 1.0);
			}
		`;	

		this.program = InitShaderProgram( vertexShaderSource, fragmentShaderSource);
		this.vertPos = gl.getAttribLocation( this.program, 'vertPos');
		this.normals = gl.getAttribLocation( this.program, 'normals');

		this.mvp = gl.getUniformLocation( this.program, 'mvp');
		this.mv = gl.getUniformLocation( this.program, 'mv');
		this.normalMatrix = gl.getUniformLocation( this.program, 'normalMatrix');

		this.texCoords = gl.getAttribLocation(this.program, 'texCoords');
		this.swapAxes = gl.getUniformLocation(this.program, 'swapAxes');
		this._swap_axes = false;

		this.textureImage = gl.getUniformLocation(this.program, 'textureImage');
		this.useTexture = gl.getUniformLocation(this.program, 'useTexture');
		this.lightDir = gl.getUniformLocation(this.program, 'lightDir');
		this.shininess = gl.getUniformLocation(this.program, 'shininess');


		this.texbuffer = gl.createBuffer();
		this.texture = gl.createTexture();
		this.vertbuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();

		this._use_texture = false;
	}
	
	setMesh( vertPos, texCoords, normals )
	{

		gl.useProgram(this.program)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}

	swapYZ( swap )
	{
		this._swap_axes = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.program );
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.normalMatrix, false, matrixNormal );


		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.vertexAttribPointer(this.texCoords, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoords);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normals, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normals);


		gl.uniform1i(this.useTexture, this._use_texture);
		gl.uniform1i(this.swapAxes, this._swap_axes);


		if (this._use_texture) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(this.textureImage, 0); 
		}
	
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
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
	

	showTexture( show )
	{
		this._use_texture = show;
	}
	
	setLightDir( x, y, z )
	{
		gl.useProgram( this.program );
		gl.uniform3f(this.lightDir, x, y, z); 
	}
	
	setShininess( shininess )
	{
		gl.useProgram( this.program );
		gl.uniform1f(this.shininess, shininess); 
	}
}
