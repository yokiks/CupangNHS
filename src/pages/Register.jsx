import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';
import { Eye, EyeOff } from "lucide-react";

const MAX_PROOF_SIZE = 10 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const NAME_PATTERN = /^(?=.{1,100}$)\p{L}+(?:['’-]\p{L}+)*(?:\.(?=\s|$))?(?: \p{L}+(?:['’-]\p{L}+)*(?:\.(?=\s|$))?)*$/u;
const GMAIL_PATTERN = /^(?=.{1,64}@)(?![^@]*\.\.)[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?(?:\+[a-z0-9._-]+)?@gmail\.com$/i;
const SECTION_PATTERN = /^(?=.{1,50}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;

const formatProperName = (value) => value
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase()
  .replace(/(^|[\s'’-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase()}`);

const validateField = (name, value, values) => {
  const text = typeof value === 'string' ? value.trim() : value;
  switch (name) {
    case 'firstName':
    case 'lastName':
      if (!text) return 'This name is required.';
      return NAME_PATTERN.test(formatProperName(text)) ? '' : 'Use letters, spaces, hyphens, periods, or apostrophes only.';
    case 'studentEmail':
      if (!text) return 'Student email is required.';
      return GMAIL_PATTERN.test(text) ? '' : 'Enter a valid Gmail address ending in @gmail.com.';
    case 'gradeLevel':
      return /^(7|8|9|10)$/.test(text) ? '' : 'Select a grade level.';
    case 'section':
      if (!text) return 'Section is required.';
      return SECTION_PATTERN.test(formatProperName(text)) ? '' : 'Enter a valid section name using letters and name punctuation.';
    case 'lrn':
      if (!text) return 'LRN is required.';
      return /^109323\d{6}$/.test(text) ? '' : 'Enter exactly 12 digits beginning with 109323.';
    case 'parentName':
      if (!text) return 'Parent/guardian name is required.';
      return NAME_PATTERN.test(formatProperName(text)) ? '' : 'Use letters, spaces, hyphens, periods, or apostrophes only.';
    case 'parentEmail':
      if (!text) return 'Parent/guardian email is required.';
      return GMAIL_PATTERN.test(text) ? '' : 'Enter a valid Gmail address';
    case 'parentContact':
      if (!text) return 'Parent contact is required.';
      return /^09\d{9}$/.test(text) ? '' : 'Enter exactly 11 digits beginning with 09.';
    case 'username':
      return text ? '' : 'Username is required.';
    case 'password':
      if (!value) return 'Password is required.';
      return value.length >= 8 ? '' : `Add ${8 - value.length} more character${8 - value.length === 1 ? '' : 's'}.`;
    case 'confirmPassword':
      if (!value) return 'Please confirm your password.';
      return value === values.password ? '' : 'Passwords do not match.';
    default:
      return '';
  }
};

const inputClass = (hasError, extra = '') =>
  `w-full px-4 py-3 border-2 rounded-xl outline-none transition-colors ${hasError
    ? 'border-red-500 bg-red-50 focus:border-red-600'
    : 'border-gray-200 focus:border-primary-500'} ${extra}`;

const FieldMessage = ({ error, note, success = false }) => (
  <p className={`mt-1 text-xs ${error ? 'font-medium text-red-600' : success ? 'font-medium text-green-600' : 'text-gray-500'}`} role={error ? 'alert' : undefined}>
    {error || note}
  </p>
);

const RegistrationNotice = () => (
  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm leading-6 text-yellow-900">
    <p className="font-bold">Important Notice</p>
    <p className="mt-1">
      Please provide complete, accurate, and truthful information during registration. Submitted details will be used for account verification and school-related purposes. All personal information will be handled confidentially in accordance with the Data Privacy Act of 2012 (RA 10173).
    </p>
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    role: 'student',

    // Student fields:
    firstName: '',
    lastName: '',
    lrn: '',
    studentEmail: '',
    gradeLevel: '',
    section: '',
    parentName: '',
    parentEmail: '',
    parentContact: '',
    schoolIdProof: null,

    // Shared fields:
    username: '',
    password: '',
    confirmPassword: '',

    // Guidance counselor fields:
    guidanceEmail: '',
    guidanceId: '',
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'parentContact'
      ? value.replace(/\D/g, '').slice(0, 11)
      : name === 'lrn'
      ? value.replace(/\D/g, '').slice(0, 12)
      : value;
    const nextFormData = { ...formData, [name]: nextValue };
    setFormData(nextFormData);
    setFieldErrors((current) => {
      if (!current[name] && !(name === 'password' && current.confirmPassword)) return current;
      return {
        ...current,
        [name]: validateField(name, nextValue, nextFormData),
        ...(name === 'password' && current.confirmPassword
          ? { confirmPassword: validateField('confirmPassword', nextFormData.confirmPassword, nextFormData) }
          : {}),
      };
    });
    setError('');
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    const nextValue = ['firstName', 'lastName', 'parentName', 'section'].includes(name)
      ? formatProperName(value)
      : value;
    const nextFormData = { ...formData, [name]: nextValue };
    setFormData(nextFormData);
    setFieldErrors((current) => ({
      ...current,
      [name]: validateField(name, nextValue, nextFormData),
    }));
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && !ALLOWED_PROOF_TYPES.includes(file.type)) {
      e.target.value = '';
      setFormData({ ...formData, schoolIdProof: null });
      setFieldErrors((current) => ({ ...current, schoolIdProof: 'Choose a JPG, JPEG, PNG, or PDF file.' }));
      setError('School ID must be a JPG, JPEG, PNG, or PDF file.');
      return;
    }

    if (file && file.size > MAX_PROOF_SIZE) {
      e.target.value = '';
      setFormData({ ...formData, schoolIdProof: null });
      setFieldErrors((current) => ({ ...current, schoolIdProof: 'The selected file is larger than 10 MB.' }));
      setError('School ID file must not exceed 10 MB.');
      return;
    }
    setFormData({ ...formData, schoolIdProof: file });
    setFieldErrors((current) => ({ ...current, schoolIdProof: file ? '' : 'School ID is required.' }));
    setError('');
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fieldsToValidate = [
      'firstName', 'lastName', 'studentEmail', 'gradeLevel', 'section', 'lrn',
      'parentName', 'parentEmail', 'parentContact', 'username', 'password', 'confirmPassword',
    ];
    const nextFieldErrors = Object.fromEntries(
      fieldsToValidate
        .map((name) => [name, validateField(name, formData[name], formData)])
        .filter(([, message]) => message)
    );
    if (!formData.schoolIdProof) nextFieldErrors.schoolIdProof = 'School ID is required.';
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      setError('Please correct the highlighted fields before continuing.');
      setLoading(false);
      return;
    }

    if (!formData.username || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.lrn || !formData.studentEmail) {
      setError('Please fill all student required fields');
      setLoading(false);
      return;
    }

    if (!formData.parentName || !formData.parentEmail || !formData.parentContact) {
      setError('Please fill all parent/guardian required fields');
      setLoading(false);
      return;
    }

    const firstName = formatProperName(formData.firstName);
    const lastName = formatProperName(formData.lastName);
    const parentName = formatProperName(formData.parentName);

    if (!NAME_PATTERN.test(firstName) || !NAME_PATTERN.test(lastName)) {
      setError("Names may contain letters, spaces, hyphens, periods, and apostrophes only.");
      setLoading(false);
      return;
    }

    if (!NAME_PATTERN.test(parentName)) {
      setError("Parent/guardian name may contain letters, spaces, hyphens, periods, and apostrophes only.");
      setLoading(false);
      return;
    }

    if (!GMAIL_PATTERN.test(formData.studentEmail.trim())) {
      setError('Student email must be a valid @gmail.com address.');
      setLoading(false);
      return;
    }

    if (!GMAIL_PATTERN.test(formData.parentEmail.trim())) {
      setError('Parent/guardian email must be a valid @gmail.com address.');
      setLoading(false);
      return;
    }

    const section = formatProperName(formData.section);
    if (!/^(7|8|9|10)$/.test(formData.gradeLevel) || !SECTION_PATTERN.test(section)) {
      setError('Select Grade 7–10 and enter a valid section name.');
      setLoading(false);
      return;
    }

    const lrnPattern = /^109323\d{6}$/;
    if (!lrnPattern.test(formData.lrn.trim())) {
      setError('LRN must be 12 digits and start with 109323');
      setLoading(false);
      return;
    }

    const parentContactPattern = /^09\d{9}$/;
    if (!parentContactPattern.test(formData.parentContact.trim())) {
      setError('Parent contact must be 11 digits and start with 09.');
      setLoading(false);
      return;
    }

    if (!formData.schoolIdProof) {
      setError('Please upload proof of enrollment (School ID).');
      setLoading(false);
      return;
    }

    if (!ALLOWED_PROOF_TYPES.includes(formData.schoolIdProof.type) || formData.schoolIdProof.size > MAX_PROOF_SIZE) {
      setError('School ID must be a JPG, JPEG, PNG, or PDF file no larger than 10 MB.');
      setLoading(false);
      return;
    }

    const formPayload = new FormData();
    formPayload.append('role', 'student');
    formPayload.append('firstName', firstName);
    formPayload.append('lastName', lastName);
    formPayload.append('username', formData.username.trim());
    formPayload.append('password', formData.password);
    formPayload.append('lrn', formData.lrn.trim());
    formPayload.append('studentEmail', formData.studentEmail.trim().toLowerCase());
    formPayload.append('parentName', parentName);
    formPayload.append('parentEmail', formData.parentEmail.trim().toLowerCase());
    formPayload.append('parentContact', formData.parentContact.trim());
    formPayload.append('gradeLevel', `Grade ${formData.gradeLevel} - ${section}`);
    formPayload.append('schoolIdProof', formData.schoolIdProof);

    const result = await register(formPayload);

    if (result.success) {
      showToast(result.message || 'Registration submitted and pending approval.', 'success');
      navigate('/login');
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <PageBackground>
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-4xl">

          <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">

            <div className="relative p-6 md:p-10">

              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
                  Create an Account
                </h2>
                <p className="text-gray-600">Join us today! It's quick and easy.</p>
              </div>

              <div className="mb-6">
                <RegistrationNotice />
              </div>

              {!showRegistrationForm && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm(true)}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition"
                  >
                    Continue to Registration
                  </button>
                  <div className="text-center">
                    <Link to="/login" className="text-primary-600 font-semibold">
                      Already have an account? Login here
                    </Link>
                  </div>
                </div>
              )}

              {/* Error */}
              {showRegistrationForm && error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {showRegistrationForm && (
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Role Selection removed: only students can self-register */}

                {/* STUDENT FORM */}
                {formData.role === 'student' && (
                  <>
                    {/* Student Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
                      <h3 className="text-xl font-bold text-primary-700 mb-4">Student Details</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* First Name */}
                        <div>
                          <label className="block font-semibold mb-1">First Name *</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.firstName)}
                            className={inputClass(Boolean(fieldErrors.firstName))}
                            placeholder="Enter your first name"
                          />
                          <FieldMessage error={fieldErrors.firstName} note="Capitalization is corrected automatically." />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block font-semibold mb-1">Last Name *</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.lastName)}
                            className={inputClass(Boolean(fieldErrors.lastName))}
                            placeholder="Enter your last name"
                          />
                          <FieldMessage error={fieldErrors.lastName} note="Capitalization is corrected automatically." />
                        </div>

                        {/* Student Email */}
                        <div>
                          <label className="block font-semibold mb-1">Student Email *</label>
                          <input
                            type="email"
                            name="studentEmail"
                            value={formData.studentEmail}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.studentEmail)}
                            className={inputClass(Boolean(fieldErrors.studentEmail))}
                            placeholder="example@gmail.com"
                          />
                          <FieldMessage error={fieldErrors.studentEmail} note="Must end in @gmail.com." />
                        </div>

                        {/* Grade Level */}
                        <div>
                          <label className="block font-semibold mb-1">Grade & Section *</label>
                          <select
                            name="gradeLevel"
                            value={formData.gradeLevel}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.gradeLevel)}
                            className={inputClass(Boolean(fieldErrors.gradeLevel))}
                          >
                            <option value="">Select grade</option>
                            {[7, 8, 9, 10].map((grade) => (
                              <option key={grade} value={String(grade)}>Grade {grade}</option>
                            ))}
                          </select>
                          <FieldMessage error={fieldErrors.gradeLevel} note="Choose your current grade level." />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Section *</label>
                          <input
                            type="text"
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.section)}
                            className={inputClass(Boolean(fieldErrors.section))}
                            placeholder="e.g., Rizal"
                            maxLength={50}
                          />
                          <FieldMessage error={fieldErrors.section} note="Enter the official section name." />
                        </div>

                        {/* LRN */}
                        <div className="md:col-span-2">
                          <label className="block font-semibold mb-1">LRN *</label>
                          <input
                            type="text"
                            name="lrn"
                            value={formData.lrn}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.lrn)}
                            className={inputClass(Boolean(fieldErrors.lrn))}
                            placeholder="109323XXXXXX"
                            inputMode="numeric"
                            maxLength={12}
                            pattern="109323[0-9]{6}"
                          />
                          <FieldMessage error={fieldErrors.lrn} note="12-digit number starting with 109323." />
                        </div>
                      </div>
                    </div>

                    {/* Parent Info */}
                    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
                      <h3 className="text-xl font-bold text-primary-700 mb-4">Parent / Guardian Information</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="md:col-span-2">
                          <label className="block font-semibold mb-1">Parent Name *</label>
                          <input
                            type="text"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.parentName)}
                            className={inputClass(Boolean(fieldErrors.parentName))}
                            placeholder="Enter parent/guardian full name"
                          />
                          <FieldMessage error={fieldErrors.parentName} note="Capitalization is corrected automatically." />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Parent Email *</label>
                          <input
                            type="email"
                            name="parentEmail"
                            value={formData.parentEmail}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.parentEmail)}
                            className={inputClass(Boolean(fieldErrors.parentEmail))}
                            placeholder="example@gmail.com"
                          />
                          <FieldMessage error={fieldErrors.parentEmail} note="Must end in @gmail.com." />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Parent Contact *</label>
                          <input
                            type="text"
                            name="parentContact"
                            value={formData.parentContact}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            aria-invalid={Boolean(fieldErrors.parentContact)}
                            className={inputClass(Boolean(fieldErrors.parentContact))}
                            placeholder="09XXXXXXXXX"
                            inputMode="numeric"
                            maxLength={11}
                            pattern="09[0-9]{9}"
                          />
                          <FieldMessage error={fieldErrors.parentContact} note="11 digits starting with 09." />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
                      <h3 className="text-xl font-bold text-primary-700 mb-4">Proof of Enrollment</h3>
                      <div>
                        <label className="block font-semibold mb-1">School ID *</label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={handleFileChange}
                          aria-invalid={Boolean(fieldErrors.schoolIdProof)}
                          className={inputClass(Boolean(fieldErrors.schoolIdProof))}
                        />
                        {formData.schoolIdProof && (
                          <p className="mt-2 text-sm text-gray-600">Selected file: {formData.schoolIdProof.name}</p>
                        )}
                        <FieldMessage error={fieldErrors.schoolIdProof} note="JPG, JPEG, PNG, or PDF only. Maximum file size: 10 MB." />
                      </div>
                    </div>
                  </>
                )}

                {/* Guidance Counselor form removed: counselors will receive provisioned accounts */}

                {/* Username + Password */}
                <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
                  <h3 className="text-xl font-bold text-primary-700 mb-4">Login Credentials</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="md:col-span-2">
                      <label className="block font-semibold mb-1">Username *</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={handleNameBlur}
                        aria-invalid={Boolean(fieldErrors.username)}
                        className={inputClass(Boolean(fieldErrors.username))}
                        placeholder="Choose a username"
                      />
                      <FieldMessage error={fieldErrors.username} note="You will use this username to log in." />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleNameBlur}
                          aria-invalid={Boolean(fieldErrors.password)}
                          className={inputClass(Boolean(fieldErrors.password), 'pr-12')}
                          placeholder="Minimum 8 characters"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff size={20} strokeWidth={2} />
                          ) : (
                            <Eye size={20} strokeWidth={2} />
                          )}
                        </button>
                      </div>
                      <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${formData.password.length >= 8
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
                        <p className="font-semibold">To continue, your password must:</p>
                        <p className="mt-1">
                          <span aria-hidden="true">{formData.password.length >= 8 ? '✓' : '○'}</span>{' '}
                          Contain at least 8 characters
                          {formData.password.length > 0 && formData.password.length < 8
                            ? ` (${8 - formData.password.length} more needed)`
                            : ''}
                        </p>
                      </div>
                      {fieldErrors.password && <FieldMessage error={fieldErrors.password} />}
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleNameBlur}
                          aria-invalid={Boolean(fieldErrors.confirmPassword)}
                          className={inputClass(Boolean(fieldErrors.confirmPassword), 'pr-12')}
                          placeholder="Re-enter your password"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} strokeWidth={2} />
                          ) : (
                            <Eye size={20} strokeWidth={2} />
                          )}
                        </button>
                      </div>
                      <FieldMessage
                        error={fieldErrors.confirmPassword}
                        note={formData.confirmPassword && formData.confirmPassword === formData.password
                          ? '✓ Passwords match.'
                          : 'Enter the same password again.'}
                        success={Boolean(formData.confirmPassword && formData.confirmPassword === formData.password)}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
              )}

              {/* Login Redirect */}
              {showRegistrationForm && (
              <div className="text-center mt-6">
                <Link to="/login" className="text-primary-600 font-semibold">
                  Already have an account? Login here
                </Link>
              </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Register;

// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import PageBackground from '../components/PageBackground';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     role: 'student',
//     lrn: '',
//     studentEmail: '',
//     gradeLevel: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     parentName: '',
//     parentEmail: '',
//     parentContact: ''
//   });

//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     if (!formData.firstName || !formData.lastName || !formData.username) {
//       setError('Please fill in all required fields');
//       setLoading(false);
//       return;
//     }

//     if (formData.role === 'student') {
//       if (!formData.lrn) {
//         setError('LRN is required for students');
//         setLoading(false);
//         return;
//       }

//       const lrnPattern = /^301420\d{6}$/;
//       if (!lrnPattern.test(formData.lrn.trim())) {
//         setError('LRN must be 12 digits and start with 301420');
//         setLoading(false);
//         return;
//       }
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       setLoading(false);
//       return;
//     }

//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters');
//       setLoading(false);
//       return;
//     }

//     const userData = {
//       firstName: formData.firstName.trim(),
//       lastName: formData.lastName.trim(),
//       username: formData.username.trim(),
//       role: formData.role,
//       password: formData.password,
//     };

//     if (formData.role === 'student') {
//       userData.studentId = formData.lrn.trim();
//       userData.lrn = formData.lrn.trim();
//       userData.studentEmail = formData.studentEmail.trim();
//       userData.gradeLevel = formData.gradeLevel.trim();
//       userData.parentName = formData.parentName.trim();
//       userData.parentEmail = formData.parentEmail.trim();
//       userData.parentContact = formData.parentContact.trim();
//     }

//     const result = await register(userData);

//     if (result.success) navigate('/dashboard');
//     else setError(result.message || 'Registration failed');

//     setLoading(false);
//   };

//   return (
//     <PageBackground>
//       <Navbar />

//       <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-12">
//         <div className="w-full max-w-4xl">
//           {/* Main Card */}
//           <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">
//             {/* Decorative Elements */}
//             <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
//             <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>
            
//             <div className="relative p-6 md:p-10">
//               {/* Header Section */}
//               <div className="text-center mb-8">
//                 <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4 transform hover:rotate-12 transition-transform duration-300">
//                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
//                   </svg>
//                 </div>
//                 <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">Create an Account</h2>
//                 <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-3 rounded-full"></div>
//                 <p className="text-gray-600">Join us today! It's quick and easy.</p>
//               </div>

//               {/* Error Message */}
//               {error && (
//                 <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-fade-in">
//                   <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                   <p className="text-sm text-red-700 font-medium">{error}</p>
//                 </div>
//               )}

//               <form onSubmit={handleSubmit} className="space-y-8">
//                 {/* Student Details Section */}
//                 <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
//                   <div className="flex items-center space-x-3 mb-5">
//                     <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
//                       <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                       </svg>
//                     </div>
//                     <h3 className="text-xl font-bold text-primary-700">Student Details</h3>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {/* First Name */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         First Name <span className="text-red-500">*</span>
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="text"
//                           name="firstName"
//                           value={formData.firstName}
//                           onChange={handleChange}
//                           className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                           placeholder="Enter first name"
//                           required
//                         />
//                       </div>
//                     </div>

//                     {/* Last Name */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Last Name <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="lastName"
//                         value={formData.lastName}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="Enter last name"
//                         required
//                       />
//                     </div>

//                     {/* Student Email */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Student Email <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         name="studentEmail"
//                         value={formData.studentEmail}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="student@example.com"
//                         required
//                       />
//                     </div>

//                     {/* Grade Level */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Grade & Section <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="gradeLevel"
//                         value={formData.gradeLevel}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="e.g., Grade 10 - Rizal"
//                         required
//                       />
//                     </div>

//                     {/* LRN */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Learner Reference Number (LRN) <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="lrn"
//                         value={formData.lrn}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="301420XXXXXX"
//                         required
//                       />
//                       <p className="text-xs text-gray-500 mt-1">Must start with 301420 (12 digits total)</p>
//                     </div>

//                     {/* Username */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Username <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="username"
//                         value={formData.username}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="Choose a username"
//                         required
//                       />
//                     </div>

//                     {/* Password */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Password <span className="text-red-500">*</span>
//                       </label>
//                       <div className="relative">
//                         <input
//                           type={showPassword ? "text" : "password"}
//                           name="password"
//                           value={formData.password}
//                           onChange={handleChange}
//                           className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                           placeholder="Enter password (min. 6 characters)"
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPassword(!showPassword)}
//                           className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
//                         >
//                           {showPassword ? (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                             </svg>
//                           ) : (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                             </svg>
//                           )}
//                         </button>
//                       </div>
//                     </div>

//                     {/* Confirm Password */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Confirm Password <span className="text-red-500">*</span>
//                       </label>
//                       <div className="relative">
//                         <input
//                           type={showConfirmPassword ? "text" : "password"}
//                           name="confirmPassword"
//                           value={formData.confirmPassword}
//                           onChange={handleChange}
//                           className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                           placeholder="Re-enter password"
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                           className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
//                         >
//                           {showConfirmPassword ? (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                             </svg>
//                           ) : (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                             </svg>
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Parent/Guardian Section */}
//                 <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary-100">
//                   <div className="flex items-center space-x-3 mb-5">
//                     <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
//                       <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                       </svg>
//                     </div>
//                     <h3 className="text-xl font-bold text-primary-700">Parent / Guardian Information</h3>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {/* Parent Name */}
//                     <div className="group md:col-span-2">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Full Name <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="parentName"
//                         value={formData.parentName}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="Parent/Guardian full name"
//                         required
//                       />
//                     </div>

//                     {/* Parent Email */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Email <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         name="parentEmail"
//                         value={formData.parentEmail}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="parent@example.com"
//                         required
//                       />
//                     </div>

//                     {/* Parent Contact */}
//                     <div className="group">
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Contact Number <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="parentContact"
//                         value={formData.parentContact}
//                         onChange={handleChange}
//                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
//                         placeholder="09XXXXXXXXX"
//                         required
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="group relative w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
//                 >
//                   <span className="relative z-10 flex items-center justify-center space-x-2">
//                     {loading ? (
//                       <>
//                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         <span>Creating Account...</span>
//                       </>
//                     ) : (
//                       <>
//                         <span>Create Account</span>
//                         <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                         </svg>
//                       </>
//                     )}
//                   </span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
//                 </button>
//               </form>

//               {/* Divider */}
//               <div className="relative my-6">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-200"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-4 bg-white text-gray-500">Already have an account?</span>
//                 </div>
//               </div>

//               {/* Login Link */}
//               <Link 
//                 to="/login"
//                 className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transform hover:-translate-y-0.5 transition-all duration-300"
//               >
//                 Login Here
//               </Link>

//               {/* Additional Info */}
//               <div className="mt-6 text-center">
//                 <p className="text-xs text-gray-500">
//                   By creating an account, you agree to our{' '}
//                   <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
//                   {' '}and{' '}
//                   <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />
//     </PageBackground>
//   );
// };

// export default Register;

// // import { useState } from 'react'
// // import { Link, useNavigate } from 'react-router-dom'
// // import { useAuth } from '../context/AuthContext'
// // import Navbar from '../components/Navbar'
// // import Footer from '../components/Footer'
// // import PageBackground from '../components/PageBackground'

// // const Register = () => {
// //   const [formData, setFormData] = useState({
// //     firstName: '',
// //     lastName: '',
// //     role: 'student',
// //     lrn: '',
// //     username: '',
// //     password: '',
// //     confirmPassword: ''
// //   })
// //   const [error, setError] = useState('')
// //   const [loading, setLoading] = useState(false)
// //   const { register } = useAuth()
// //   const navigate = useNavigate()

// //   const handleChange = (e) => {
// //     const { name, value } = e.target
// //     setFormData({
// //       ...formData,
// //       [name]: value
// //     })
// //     setError('')
// //   }

// //   const handleSubmit = async (e) => {
// //     e.preventDefault()
// //     setError('')
// //     setLoading(true)
// //     // Validation
// //     if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
// //       setError('Please fill in all required fields')
// //       setLoading(false)
// //       return
// //     }

// //     if (formData.role === 'student') {
// //       if (!formData.lrn) {
// //         setError('Learner Reference Number (LRN) is required for students')
// //         setLoading(false)
// //         return
// //       }
// //       const lrnPattern = /^301420\d{6}$/
// //       if (!lrnPattern.test(formData.lrn.trim())) {
// //         setError('LRN must be 12 digits and start with 301420')
// //         setLoading(false)
// //         return
// //       }
// //     }

// //     if (formData.password !== formData.confirmPassword) {
// //       setError('Passwords do not match')
// //       setLoading(false)
// //       return
// //     }

// //     if (formData.password.length < 6) {
// //       setError('Password must be at least 6 characters long')
// //       setLoading(false)
// //       return
// //     }

// //     const trimmedLrn = formData.lrn.trim()
// //     const userData = {
// //       firstName: formData.firstName.trim(),
// //       lastName: formData.lastName.trim(),
// //       role: formData.role,
// //       username: formData.username.trim(),
// //       password: formData.password,
// //     }

// //     if (formData.role === 'student') {
// //       userData.studentId = trimmedLrn
// //       userData.lrn = trimmedLrn
// //     }

// //     const result = await register(userData)
    
// //     if (result.success) {
// //       navigate('/dashboard')
// //     } else {
// //       setError(result.message || 'Registration failed. Please try again.')
// //     }
    
// //     setLoading(false)
// //   }

// //   return (
// //     <PageBackground>
// //       <Navbar />
      
// //       <main className="flex-grow flex items-center justify-center px-4 py-12">
// //         <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">
// //           <h2 className="text-3xl font-bold text-primary-600 mb-2 text-center">Create an account</h2>
// //           <p className="text-gray-600 text-center mb-8">It's quick and easy.</p>

// //           {error && (
// //             <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
// //               {error}
// //             </div>
// //           )}

// //           <form onSubmit={handleSubmit} className="space-y-4">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
// //                   First Name *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="firstName"
// //                   name="firstName"
// //                   value={formData.firstName}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                   required
// //                 />
// //               </div>

// //               <div>
// //                 <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
// //                   Last Name *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="lastName"
// //                   name="lastName"
// //                   value={formData.lastName}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                   required
// //                 />
// //               </div>
// //             </div>

// //             <div>
// //               <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Register as *
// //               </label>
// //               <select
// //                 id="role"
// //                 name="role"
// //                 value={formData.role}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //               >
// //                 <option value="student">Student</option>
// //                 <option value="guidance_counselor">Guidance Counselor</option>
// //               </select>
// //             </div>

// //             {formData.role === 'student' && (
// //               <div>
// //                 <label htmlFor="lrn" className="block text-sm font-semibold text-gray-700 mb-2">
// //                   Learner Reference Number (LRN) *
// //                 </label>
// //                 <input
// //                   type="text"
// //                   id="lrn"
// //                   name="lrn"
// //                   value={formData.lrn}
// //                   onChange={handleChange}
// //                   placeholder="12-digit DepEd LRN"
// //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                   required
// //                 />
// //                 <p className="text-xs text-gray-500 mt-1">
// //                   Your LRN must start with 301420 and have 12 digits total.
// //                 </p>
// //               </div>
// //             )}

// //             <div>
// //               <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Username *
// //               </label>
// //               <input
// //                 type="text"
// //                 id="username"
// //                 name="username"
// //                 value={formData.username}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                 required
// //               />
// //             </div>

// //             <div>
// //               <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Password *
// //               </label>
// //               <input
// //                 type="password"
// //                 id="password"
// //                 name="password"
// //                 value={formData.password}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                 required
// //                 minLength={6}
// //               />
// //             </div>

// //             <div>
// //               <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Confirm Password *
// //               </label>
// //               <input
// //                 type="password"
// //                 id="confirmPassword"
// //                 name="confirmPassword"
// //                 value={formData.confirmPassword}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                 required
// //                 minLength={6}
// //               />
// //             </div>

// //             <button
// //               type="submit"
// //               disabled={loading}
// //               className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
// //             >
// //               {loading ? 'Creating account...' : 'Sign Up'}
// //             </button>
// //           </form>

// //           <p className="mt-6 text-center text-gray-600 text-sm">
// //             Already have an account?{' '}
// //             <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
// //               Log In
// //             </Link>
// //           </p>
// //         </div>
// //       </main>

// //       <Footer />
// //     </PageBackground>
// //   )
// // }

// // export default Register

// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import PageBackground from '../components/PageBackground'

// const Register = () => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     role: 'student',
//     lrn: '',
//     studentEmail: '',
//     gradeLevel: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     parentName: '',
//     parentEmail: '',
//     parentContact: ''
//   })

//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const { register } = useAuth()
//   const navigate = useNavigate()

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData({ ...formData, [name]: value })
//     setError('')
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     if (!formData.firstName || !formData.lastName || !formData.username) {
//       setError('Please fill in all required fields')
//       setLoading(false)
//       return
//     }

//     if (formData.role === 'student') {
//       if (!formData.lrn) {
//         setError('LRN is required for students')
//         setLoading(false)
//         return
//       }

//       const lrnPattern = /^301420\d{6}$/
//       if (!lrnPattern.test(formData.lrn.trim())) {
//         setError('LRN must be 12 digits and start with 301420')
//         setLoading(false)
//         return
//       }
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match')
//       setLoading(false)
//       return
//     }

//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters')
//       setLoading(false)
//       return
//     }

//     const userData = {
//       firstName: formData.firstName.trim(),
//       lastName: formData.lastName.trim(),
//       username: formData.username.trim(),
//       role: formData.role,
//       password: formData.password,
//     }

//     if (formData.role === 'student') {
//       userData.studentId = formData.lrn.trim()
//       userData.lrn = formData.lrn.trim()
//       userData.studentEmail = formData.studentEmail.trim()
//       userData.gradeLevel = formData.gradeLevel.trim()

//       // Parent Info
//       userData.parentName = formData.parentName.trim()
//       userData.parentEmail = formData.parentEmail.trim()
//       userData.parentContact = formData.parentContact.trim()
//     }

//     const result = await register(userData)

//     if (result.success) navigate('/dashboard')
//     else setError(result.message || 'Registration failed')

//     setLoading(false)
//   }

//   return (
//     <PageBackground>
//       <Navbar />

//       <main className="flex-grow flex items-center justify-center px-4 py-12">
//         <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-10">

//           {/* HEADER */}
//           <h2 className="text-3xl font-bold text-primary-600 mb-2 text-center">
//             Create an Account
//           </h2>
//           <p className="text-gray-600 text-center mb-8">It's quick and easy.</p>

//           {/* ERROR MESSAGE */}
//           {error && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-10">

//             {/* =============================== */}
//             {/* STUDENT / USER DETAILS SECTION */}
//             {/* =============================== */}
//             <div>
//               <h3 className="text-xl font-bold text-primary-700 mb-4 border-b pb-2">
//                 👤 Student Details (User Account)
//               </h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* First Name */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">First Name *</label>
//                   <input
//                     type="text"
//                     name="firstName"
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Last Name */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Last Name *</label>
//                   <input
//                     type="text"
//                     name="lastName"
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Student Email */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Student Email *</label>
//                   <input
//                     type="email"
//                     name="studentEmail"
//                     value={formData.studentEmail}
//                     onChange={handleChange}
//                     placeholder="student@gmail.com"
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Grade / Section / Year */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Grade & Section *</label>
//                   <input
//                     type="text"
//                     name="gradeLevel"
//                     value={formData.gradeLevel}
//                     onChange={handleChange}
//                     placeholder="Example: Grade 10 - Rizal"
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* LRN */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">LRN *</label>
//                   <input
//                     type="text"
//                     name="lrn"
//                     value={formData.lrn}
//                     onChange={handleChange}
//                     placeholder="301420XXXXXX"
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Username */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Username *</label>
//                   <input
//                     type="text"
//                     name="username"
//                     value={formData.username}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Password *</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Confirm Password */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Confirm Password *</label>
//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* ======================================= */}
//             {/* PARENT / GUARDIAN SECTION */}
//             {/* ======================================= */}
//             <div>
//               <h3 className="text-xl font-bold text-primary-700 mb-4 border-b pb-2">
//                 👪 Parent / Guardian Information
//               </h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Parent Name */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Full Name *</label>
//                   <input
//                     type="text"
//                     name="parentName"
//                     value={formData.parentName}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Parent Email */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Email *</label>
//                   <input
//                     type="email"
//                     name="parentEmail"
//                     value={formData.parentEmail}
//                     onChange={handleChange}
//                     placeholder="guardian@gmail.com"
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>

//                 {/* Parent Contact */}
//                 <div>
//                   <label className="block text-sm font-semibold mb-1">Contact Number *</label>
//                   <input
//                     type="text"
//                     name="parentContact"
//                     value={formData.parentContact}
//                     onChange={handleChange}
//                     placeholder="09XXXXXXXXX"
//                     className="w-full px-4 py-3 border rounded-lg"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* SUBMIT BUTTON */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg shadow-lg hover:bg-primary-700 transition"
//             >
//               {loading ? 'Creating account…' : 'Sign Up'}
//             </button>

//           </form>

//           {/* LOGIN LINK */}
//           <p className="mt-6 text-center text-gray-600">
//             Already have an account?
//             <Link to="/login" className="text-primary-600 font-semibold ml-1">
//               Log In
//             </Link>
//           </p>
//         </div>
//       </main>

//       <Footer />
//     </PageBackground>
//   )
// }

// export default Register
