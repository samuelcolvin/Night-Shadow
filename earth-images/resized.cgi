#!/usr/bin/python

def error(s):
	print 'Content-type: text/plain\n\n'
	print 'ERROR:', s
	sys.exit(2)

try:
	import Image, cgi, sys, cStringIO
	import cgitb; cgitb.enable()
	form = cgi.FieldStorage()
	help = '\n\nUse format: http://scolvin.com/nightshadow/earth-images/resized.cgi?w=1000&n=month01.jpg'
	if 'w' not in form:
		error('Width not defined in the get request.' + help)
	width = int(form['w'].value)
	if 'n' not in form:
		error('File name not defined in the get request.' + help)
	infile = form['n'].value
	size = width, width/2
	im = Image.open(infile)
	im.thumbnail(size, Image.ANTIALIAS)
	f = cStringIO.StringIO()
	im.save(f, 'JPEG', quality=90)
	print 'Content-type: image/jpeg\n'
	f.seek(0)
	print f.read()
except Exception, e:
	error(e)