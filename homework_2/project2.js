// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	let scale_trans = Array(
		scale, 0, 0, 
		0, scale, 0,
		0, 0, 1)
	let cos = Math.cos(rotation)
	let sin = Math.sin(rotation)
	let rotation_trans = Array(
		cos, sin, 0,
		-sin, cos, 0,
		0, 0, 1
	)
	let trans = ApplyTransform(scale_trans, rotation_trans)
	let translation_trans = Array(
		1, 0, 0,
		0, 1, 0,
		positionX, positionY, 1
	)
	return ApplyTransform(trans, translation_trans)
}

function MatMul(trans1, trans2){
	let res = Array(0, 0, 0, 0, 0, 0, 0, 0, 0)
	for(let i = 0; i < 3; i++)
		for(let j = 0; j < 3; j++)
			for(let k = 0; k < 3; k++){
				res[i*3+j] += trans1[i*3+k] * trans2[j+k*3]
			}

	return res
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	return MatMul(trans1, trans2)
}
