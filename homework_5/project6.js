var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		Ray r;
		HitInfo hit;
		hit.t = 1e9;

		r.pos = position + normal * 0.001;
		r.dir = normalize(lights[i].position - position);

		bool shadow = IntersectRay(hit, r) && hit.t <= length(lights[i].position - position);

		// TO-DO: If not shadowed, perform shading using the Blinn model
		if(!shadow){
			vec3 H = normalize(r.dir + view);  // Halfway vector between light and view
			vec3 ambient = 0.1 * mtl.k_d;

			float diff = max(dot(normal, r.dir), 0.0);
			vec3 diffuse = diff * mtl.k_d;

			float spec = pow(max(dot(normal, H), 0.0), mtl.n);
			vec3 specular = spec * mtl.k_s;

			color += (ambient + diffuse + specular) * lights[i].intensity;
		}
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		float a = dot(ray.dir, ray.dir); 
		float b = 2.0 * dot(ray.dir, (ray.pos - spheres[i].center));
		float c =  dot((ray.pos - spheres[i].center), (ray.pos - spheres[i].center)) - spheres[i].radius * spheres[i].radius;
		float det = b*b - 4.0*a*c; 
		if(det >= 0.0){
			// TO-DO: If intersection is found, update the given HitInfo
			float t1 = (-b - sqrt(det))/(2.0*a), t2 = (-b + sqrt(det))/(2.0*a);
			float t = (t1 < t2 && t1 > 0.0 ? t1 : (t2 > 0.0 ? t2 : -1.0));
			if(((!foundHit || hit.t > t) && t > 0.0)){
				vec3 x = ray.pos + ray.dir * t;
				vec3 normal = normalize(x - spheres[i].center);

				hit.mtl = spheres[i].mtl;
				hit.t = t;
				hit.normal = normal;
				hit.position = x;

				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			r.dir = reflect(-view, hit.normal);
			r.pos = hit.position + hit.normal * 0.001;

			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray
				hit = h;
				view = normalize(-r.dir);
				vec3 reflectClr = Shade(hit.mtl, hit.position, hit.normal, view);
				clr += k_s * reflectClr;
				k_s *= hit.mtl.k_s;

			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 1);	// return the environment color
	}
}
`;